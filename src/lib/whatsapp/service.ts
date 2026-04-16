import { createClient } from "@/lib/supabase/server";

export interface WhatsAppMessagePayload {
  churchId: string;
  recipientPhone: string;
  recipientName?: string;
  triggerEvent: "kids_registration" | "visitor_welcome" | "generic_alert";
  payload: Record<string, any>; // Used for templates, QR URLs, etc.
}

export class WhatsAppService {
  /**
   * Enqueues a message into the outbox.
   * This is the official bridge to WhatsApp integration.
   * When WAHA is active, a background worker or edge function will process this outbox.
   */
  static async enqueueMessage(data: WhatsAppMessagePayload) {
    const supabase = await createClient();
    
    // Simulate formatting or validating phone numbers here if needed
    const { error } = await supabase.from("whatsapp_outbox").insert({
      church_id: data.churchId,
      recipient_phone: data.recipientPhone,
      recipient_name: data.recipientName,
      trigger_event: data.triggerEvent,
      payload: data.payload,
      status: "pending",
    });

    if (error) {
      console.error("[WhatsAppService] Error enqueuing message:", error);
      // Depending on strictness, we might throw or return false
      return { success: false, error };
    }

    console.log(`[WhatsAppService] Message enqueued for ${data.recipientPhone} (${data.triggerEvent})`);
    return { success: true };
  }

  /**
   * Specialized sender for Kids Registration Welcome.
   */
  static async sendKidsWelcomeCard(
    churchId: string, 
    guardianPhone: string, 
    guardianName: string, 
    kidName: string,
    qrCodeValue: string,
    consentLink?: string
  ) {
    return this.enqueueMessage({
      churchId,
      recipientPhone: guardianPhone,
      recipientName: guardianName,
      triggerEvent: "kids_registration",
      payload: {
        template: "welcome_kids",
        variables: {
          guardian_name: guardianName,
          kid_name: kidName,
          qr_code: qrCodeValue,
          consent_link: consentLink
        }
      }
    });
  }
}
