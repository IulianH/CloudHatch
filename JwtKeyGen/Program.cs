// 32 bytes = 256 bits (recommended for HS256)
using System.Security.Cryptography;

int bytes = args.Length > 0 && int.TryParse(args[0], out var n) ? n : 32;

byte[] key = RandomNumberGenerator.GetBytes(bytes);
string base64 = Convert.ToBase64String(key);

Console.WriteLine("Base64 key (put this in appsettings as Jwt:Key):");
Console.WriteLine(base64);
Console.WriteLine();
Console.WriteLine($"Length: {bytes} bytes ({bytes * 8} bits)");