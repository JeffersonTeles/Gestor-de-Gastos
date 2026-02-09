import { File, Loader2, Paperclip, Trash2, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AttachmentUploaderProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  onRemove?: () => void;
}

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  onUploadComplete,
  currentUrl,
  onRemove,
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validações
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Tipo de arquivo não suportado. Use JPG, PNG ou PDF.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    if (!user) {
      setError('Você precisa estar logado para fazer upload.');
      return;
    }

    setUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload para Supabase Storage
      if (!supabase) {
        throw new Error('Supabase não configurado');
      }

      const { data, error: uploadError } = await supabase.storage
        .from('transaction-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('transaction-attachments')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Criar preview para imagens
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview('pdf');
      }

      onUploadComplete(publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Erro ao fazer upload. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentUrl || !onRemove) return;

    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = currentUrl.split('/');
      const fileName = urlParts.slice(-2).join('/'); // user_id/timestamp.ext

      if (supabase) {
        await supabase.storage
          .from('transaction-attachments')
          .remove([fileName]);
      }

      setPreview(null);
      onRemove();
    } catch (err) {
      console.error('Error removing file:', err);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
        <Paperclip size={16} />
        Comprovante
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl">
          <X size={16} />
          {error}
        </div>
      )}

      {!preview ? (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
                Fazendo upload...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/10 transition-colors">
                <Upload size={32} className="text-slate-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Clique para selecionar arquivo
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  JPG, PNG ou PDF (máx. 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative border border-slate-200 dark:border-zinc-700 rounded-xl p-4 bg-slate-50 dark:bg-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
              <File size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300 truncate">
                {preview === 'pdf' ? 'Documento PDF' : 'Imagem anexada'}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Comprovante da transação
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
              title="Remover anexo"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {preview && preview !== 'pdf' && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-32 object-cover"
              />
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 dark:text-zinc-400">
        💡 Dica: Anexe notas fiscais, recibos ou comprovantes para melhor organização
      </p>
    </div>
  );
};

export default AttachmentUploader;
