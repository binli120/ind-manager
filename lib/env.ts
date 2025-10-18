import { useLogger } from "@/hooks/useLogger";

const logger = useLogger("env");

export function getTiptapEnv() {
  const conversionAppId = process.env.TIPTAP_CONVERSION_APP_ID ?? "";
  const conversionSecret = process.env.TIPTAP_CONVERSION_SECRET ?? "";
  const conversionCloudApiKey = process.env.CLOUDCONVERT_API_KEY ?? "";
  const documentSerSecretKey =
    process.env.TIPTAP_DOCUMENT_SERVER_SECRET_KEY ?? "";

  if (
    !conversionAppId ||
    !conversionSecret ||
    !conversionCloudApiKey ||
    !documentSerSecretKey
  ) {
    logger.error(
      "Missing TIPTAP_CONVERSION_APP_ID or TIPTAP_CONVERSION_SECRET or CLOUDCONVERT_API_KEY or DOCUMENT_SER_SECRET_KEY in environment variables",
    );
  }

  return {
    conversionAppId,
    conversionSecret,
    conversionCloudApiKey,
    documentSerSecretKey,
  };
}

export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables",
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}
