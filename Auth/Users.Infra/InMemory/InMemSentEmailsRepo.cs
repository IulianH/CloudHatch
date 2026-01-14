using Users.App.Interface;
using Users.Domain;

namespace Users.Infra.InMemory
{
    public class InMemSentEmailsRepo : ISentEmailsRepo
    {
        private readonly List<SentEmail> _sentEmails = [];

        public IList<SentEmail> GetSentEmailsForDateAsync(Guid userId, SentEmailType emailType, DateTimeOffset date)
        {
            var dateOnly = date.Date;
            var emailTypeValue = (int)emailType;

            return _sentEmails
                .Where(email =>
                    email.UserId == userId &&
                    email.EmailType == emailTypeValue &&
                    email.SentAt.Date == dateOnly)
                .ToList();
        }

        public Task InsertAsync(SentEmail sentEmail)
        {
            _sentEmails.Add(sentEmail);
            return Task.CompletedTask;
        }
    }
}
