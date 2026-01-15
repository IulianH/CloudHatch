using Users.Domain;

namespace Users.App.Interface
{
    public interface ISentEmailsRepo
    {
        Task<IList<SentEmail>> GetSentEmailsForDateAsync(Guid userId, SentEmailType emailType, DateTimeOffset date);
        Task InsertAsync(SentEmail sentEmail);
    }
}
