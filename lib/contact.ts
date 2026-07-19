import { supabase } from "./supabase";

export interface ContactMessageInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

/** Public contact form submission — notifies admins via a DB trigger. */
export async function submitContactMessage(input: ContactMessageInput): Promise<void> {
  const { error } = await supabase.from("contact_messages").insert({
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    message: input.message.trim(),
  });
  if (error) throw new Error(error.message);
}
