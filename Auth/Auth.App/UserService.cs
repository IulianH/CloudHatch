using System.Text.RegularExpressions;
using System.Text.Json;

namespace Auth.App
{
    // DTOs for external service communication
    public record LoginRequest(string Username, string Password);
    public record ExternalUserResponse(string Id, string Username, DateTime CreatedAt);

    public class UserService
    {
        private readonly HttpClient _httpClient;
        private static JsonSerializerOptions _serializeOption = new()
        {
            PropertyNameCaseInsensitive = true
        };


        public UserService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }
        //3–20 characters

        //Letters, digits, underscores(_), dots(.), hyphens(-)

        //Cannot start or end with.or -

        //Cannot have consecutive..or --

        //Email rules:
        //Simplified but practical RFC-like check
        private static readonly Regex UsernameRegex = new(@"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9._-]{1,18}[a-zA-Z0-9])?|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        public async Task<User?> LoginAsync(string username, string password)
        {
            ValidateLoginCredentials(username, password);
            
            try
            {
                var loginRequest = new LoginRequest(username, password);
                var json = JsonSerializer.Serialize(loginRequest);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("login", content);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var user = JsonSerializer.Deserialize<User>(responseContent, _serializeOption);
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
                var response = await _httpClient.GetAsync($"users/{userId}");
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var user = JsonSerializer.Deserialize<User>(responseContent, _serializeOption);

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

        private void ValidateLoginCredentials(string username, string password)
        {
            var valid = ValidateUserName(username) && ValidatePassword(password);
            if (!valid)
            {
                throw new InputException("Invalid username or password format");
            }
        }


        private bool ValidateUserName(string username)
        {
            var valid = username.Length > 2 && UsernameRegex.IsMatch(username);
            return valid;
        }

        private bool ValidatePassword(string password)
        {
            var valid = password.Length > 5 && password.All(c => char.IsLetterOrDigit(c) || char.IsPunctuation(c) || char.IsWhiteSpace(c));
            return valid;
        }
    }
}
