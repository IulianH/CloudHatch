using Auth.App.Exceptions;
using System.Text.Json;
using Auth.App;

namespace Auth.Infra
{
    public class UserService(HttpClient httpClient) : Auth.App.IUserService
    {
        private static readonly JsonSerializerOptions SerializeOption = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public async Task<User?> LoginAsync(string username, string password)
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
            
            throw new AppException($"Failed when calling user service: {response}");
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
