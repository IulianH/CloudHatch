using System;
using System.Collections.Generic;
using System.Text;

namespace Users.App.Interface
{
    public interface IEmailSender
    {
        Task SendEmailAsync(string toEmail, string fromEmail, string subject, string body);
    }
}
