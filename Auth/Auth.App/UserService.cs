using System.Text.RegularExpressions;
using System.Text.Json;

namespace Auth.App
{
    // DTOs for external service communication
    public record LoginRequest(string Username, string Password);
    public record ExternalUserResponse(string Id, string Username, DateTime CreatedAt);

    public class UserService(HttpClient httpClient)
    {
        private static readonly JsonSerializerOptions SerializeOption = new()
        {
            PropertyNameCaseInsensitive = true
        };
      
        public async Task<User?> LoginAsync(string username, string password)
        {
            try
            {
                var loginRequest = new LoginRequest(username, password);
                var json = JsonSerializer.Serialize(loginRequest);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync("login", content);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var user = JsonSerializer.Deserialize<User>(responseContent, SerializeOption);
                    return user;
                }
            }
            catch (Exception)
            {
                // Log the exception if needed
                // For now, we'll return null to indicate authentication failure
            }

            return null;
        }

        public async Task<User?> FindByIdAsync(Guid userId)
        {
            try
            {
                var response = await httpClient.GetAsync($"users/{userId}");
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var user = JsonSerializer.Deserialize<User>(responseContent, SerializeOption);

                    return user;
                }
            }
            catch (Exception)
            {
                // Log the exception if needed
                // For now, we'll return null to indicate user not found
            }

            return null;
        }
    }
}
