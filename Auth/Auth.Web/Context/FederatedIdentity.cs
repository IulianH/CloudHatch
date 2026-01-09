using System.Security.Claims;
using Users.App;

namespace Auth.Web.Context
{
    public class FederatedIdentity(ClaimsPrincipal? user)
    {
        public bool IsAuthenticated()
        {
            
            return user != null && user.Identity != null && user.Identity.IsAuthenticated;
        }

        public string? GetExternalId()
        {
            if (!IsAuthenticated())
            {
                return null;
            }
            var externalId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return externalId;
        }

        public FederatedUser? GetUser()
        {
            if (!IsAuthenticated())
            {
                return null;
            }

            var externalId = GetExternalId() ?? throw new ArgumentException("Null NameIdentifier received in federated login");
            var issuer = user?.FindFirst("iss")?.Value ?? throw new ArgumentException("Null issuer received in federated login");
            var email = user?.FindFirst(ClaimTypes.Email)?.Value?.ToLower();
            var name = user?.FindFirst("name")?.Value;
            var username = user?.FindFirst("preferred_username")?.Value;

            return new FederatedUser
            {
                Id = externalId,
                Issuer = issuer,
                Email = email,
                Name = name,
                Username = username
            };
        }
    }
}
