using System.ComponentModel.DataAnnotations;

namespace Users.App
{ public record LoginRequest(
   string Username,
   string Password,
   bool LockEnabled,
   string Issuer
   );
}
