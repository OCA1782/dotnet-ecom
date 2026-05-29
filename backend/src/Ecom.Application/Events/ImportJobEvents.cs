namespace Ecom.Application.Events;

// Claim Check ticket — only the JobId travels in the RabbitMQ message;
// the full row payload stays in the DB (ImportJob.PayloadJson).
public record ImportJobQueuedMessage(Guid JobId);
