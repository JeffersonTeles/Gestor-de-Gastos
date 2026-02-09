import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

export interface SemanticSearchResult extends Transaction {
  similarity?: number;
}

// Sugestão: crie uma função RPC no Supabase chamada "match_transactions"
// que receba: query_embedding (vector), match_count (int), user_id (uuid)
// e retorne as transações mais similares (respeitando RLS por user_id).
export const semanticSearchTransactions = async (
  queryEmbedding: number[],
  userId: string,
  matchCount = 10
): Promise<SemanticSearchResult[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('match_transactions', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    user_id: userId
  });

  if (error) {
    console.error('Semantic search error:', error);
    return [];
  }

  return (data || []) as SemanticSearchResult[];
};
