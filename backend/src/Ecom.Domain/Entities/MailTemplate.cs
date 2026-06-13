namespace Ecom.Domain.Entities;

public class MailTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";               // "OrderConfirmation"
    public string DisplayName { get; set; } = "";        // "Sipariş Onayı"
    public string Source { get; set; } = "";             // "Outbox Consumer"
    public string SourceDetail { get; set; } = "";       // "OrderCreatedConsumer"
    public string Trigger { get; set; } = "";            // "Sipariş oluşturunca otomatik"
    public string TriggerPath { get; set; } = "";        // "Outbox: OrderCreated event"
    public string Subject { get; set; } = "";            // editable, {{var}} destekli
    public string BodyHtml { get; set; } = "";           // admin override (boş = varsayılan kod)
    public string DefaultBodyHtml { get; set; } = "";    // seed-time default, reset için
    public string FromName { get; set; } = "";           // boş = SMTP config'den
    public string FromAddress { get; set; } = "";        // boş = SMTP config'den
    public string CcEmails { get; set; } = "";           // virgülle ayrılmış
    public string BccEmails { get; set; } = "";          // virgülle ayrılmış
    public string Variables { get; set; } = "[]";        // JSON: ["name","orderNumber"]
    public string SampleVariables { get; set; } = "{}";  // JSON: {"name":"Ahmet","orderNumber":"ORD-001"}
    public bool IsBodyEditable { get; set; } = true;     // false = karmaşık dinamik şablon
    public bool IsEnabled { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
