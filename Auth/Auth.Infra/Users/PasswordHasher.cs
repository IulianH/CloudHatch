using System.Security.Cryptography;

namespace Auth.Infra.Users
{

    /// <summary>
    /// Provides methods to hash and verify passwords using PBKDF2.
    /// Generates a 128 bit random salt.
    /// Derives a 256 bit hash with 100 000 iterations.
    /// Stores iterations, salt, and hash in a single string.
    /// Verifies passwords in constant time.
    /// </summary>
    public static class PasswordHasher
    {
        private const int SaltSize = 16;      // 128 bit salt
        private const int HashSize = 32;      // 256 bit hash
        private const int Iterations = 100_000;

        /// <summary>
        /// Hashes a plaintext password with a randomly generated salt.
        /// </summary>
        /// <param name="password">The plaintext password.</param>
        /// <returns>A formatted string containing iteration count, salt, and hash.</returns>
        public static string Hash(string password)
        {
            using var rng = RandomNumberGenerator.Create();
            byte[] salt = new byte[SaltSize];
            rng.GetBytes(salt);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
            byte[] hash = pbkdf2.GetBytes(HashSize);

            // Format: {iterations}.{salt}.{hash}
            string iterationStr = Iterations.ToString();
            string saltB64 = Convert.ToBase64String(salt);
            string hashB64 = Convert.ToBase64String(hash);

            return $"{iterationStr}.{saltB64}.{hashB64}";
        }

        /// <summary>
        /// Verifies a plaintext password against the stored hash.
        /// </summary>
        /// <param name="storedHash">Formatted string from Hash().</param>
        /// <param name="password">The plaintext password to verify.</param>
        /// <returns>True if verified; otherwise false.</returns>
        public static bool Verify(string storedHash, string password)
        {
            var parts = storedHash.Split('.', 3);
            if (parts.Length != 3)
                throw new FormatException("Unexpected hash format. Should be '{iterations}.{salt}.{hash}'");

            int iterations = int.Parse(parts[0]);
            byte[] salt = Convert.FromBase64String(parts[1]);
            byte[] targetHash = Convert.FromBase64String(parts[2]);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
            byte[] testHash = pbkdf2.GetBytes(targetHash.Length);

            return CryptographicOperations.FixedTimeEquals(testHash, targetHash);
        }
    }
}
