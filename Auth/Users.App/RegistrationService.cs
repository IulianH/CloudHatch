using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;
using Users.App.Interface;
using Users.Domain;

namespace Users.App
{
    public class RegistrationService(IUserRepo repo)
    {
        public async Task<bool> RegisterFederatedAsync(FederatedUser fedUser)
        {
            var user = await repo.FindByExternalIdAsync(fedUser.Id);
            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    ExternalId = fedUser.Id,
                    Issuer = fedUser.Issuer,
                    Email = fedUser.Email,
                    Username = fedUser.Username ?? fedUser.Email,
                    Name = fedUser.Name,
                    CreatedAt = DateTime.UtcNow,
                    Roles = "customer"
                };
                await repo.InsertAsync(user);
                return true;
            }
            user.Issuer = fedUser.Issuer;
            user.Email = fedUser.Email;
            user.Username = fedUser.Username ?? fedUser.Email;
            user.Name = fedUser.Name;
            await repo.UpdateAsync(user);
            return true;
        }
    }
}
