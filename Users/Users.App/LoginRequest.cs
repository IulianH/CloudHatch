using System.ComponentModel.DataAnnotations;

namespace Users.App
{
    public record LoginRequest(
   [Required]
   string Username,
   [Required]
   string Password,
   bool LockEnabled
   );
}
