export type ConnectionProviderType =
  | "manual"
  | "whatsapp_baileys"
  | "whatsapp_web_js"
  | "whatsapp_web"
  | "whatsapp_cloud_api"
  | "cloud_api"
  | "telegram_bot"
  | "telegram_user"
  | "live_chat"
  | "email"
  | "sms";

export type ConnectionSessionStatus =
  | "qr_requested"
  | "qr_generated"
  | "qr_scanned"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "blocked"
  | "archived"
  | "failed";

export type ConnectionLine = {
  id: string;
  name: string;
  phoneNumber: string;
  providerType: string;
  status: string;
};

export type ConnectionActionResult = {
  lineId: string;
  providerType: string;
  status: ConnectionSessionStatus | string;
  qr?: string | null;
  message: string;
};

export type SendMessageInput = {
  line: ConnectionLine;
  recipient: string;
  messageText: string;
};

export type SendMessageResult = {
  providerMessageId: string;
};

export type ProviderCapability =
  | "send_message"
  | "receive_message"
  | "qr_auth"
  | "session_restore"
  | "reconnect"
  | "media_send"
  | "media_receive"
  | "group_read"
  | "command_receive"
  | "callback_action"
  | "presence"
  | "typing"
  | "delivery_status"
  | "read_status";

export type ProviderAdapter = {
  providerType: ConnectionProviderType;
  capabilities: ProviderCapability[];
  requestQr(line: ConnectionLine): Promise<ConnectionActionResult>;
  start(line: ConnectionLine): Promise<ConnectionActionResult>;
  stop(line: ConnectionLine): Promise<ConnectionActionResult>;
  reconnect(line: ConnectionLine): Promise<ConnectionActionResult>;
  healthCheck(line: ConnectionLine): Promise<ConnectionActionResult>;
  sendMessage(input: SendMessageInput): Promise<SendMessageResult>;
};
