export class CreateReminderDto {
  recipientEmail: string;
  sendDate: string;       // YYYY-MM-DD
  subject: string;
  placementDetails: string;
  note?: string;
}
