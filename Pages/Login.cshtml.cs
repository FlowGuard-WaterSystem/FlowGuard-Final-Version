using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FlowGuardAdmin.Pages;

[AllowAnonymous]
public class LoginModel : PageModel
{
    private readonly IConfiguration _configuration;

    public LoginModel(IConfiguration configuration) => _configuration = configuration;

    [BindProperty]
    public string Username { get; set; } = "";

    [BindProperty]
    public string Password { get; set; } = "";

    [BindProperty(SupportsGet = true)]
    public string? ReturnUrl { get; set; }

    public void OnGet() { }

    public async Task<IActionResult> OnPostAsync()
    {
        var accounts = _configuration.GetSection("Admin:Accounts").GetChildren()
            .Select(section => new
            {
                Username = section["Username"],
                Password = section["Password"]
            })
            .Where(account => !string.IsNullOrWhiteSpace(account.Username) && !string.IsNullOrEmpty(account.Password))
            .ToList();

        if (accounts.Count == 0)
        {
            ModelState.AddModelError(string.Empty,
                "Admin sign-in has not been configured. Add at least one Admin:Accounts entry in local secrets, then restart the server.");
            return Page();
        }

        var matchedAccount = accounts.FirstOrDefault(account =>
            FixedTimeEquals(Username, account.Username!) && FixedTimeEquals(Password, account.Password!));

        if (matchedAccount is null)
        {
            ModelState.AddModelError(string.Empty, "The username or password is incorrect.");
            return Page();
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, matchedAccount.Username!),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true, AllowRefresh = true });

        if (!string.IsNullOrWhiteSpace(ReturnUrl) && Url.IsLocalUrl(ReturnUrl))
            return LocalRedirect(ReturnUrl);

        return RedirectToPage("/Index");
    }

    private static bool FixedTimeEquals(string provided, string expected)
    {
        var providedBytes = Encoding.UTF8.GetBytes(provided);
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        return providedBytes.Length == expectedBytes.Length &&
               CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
    }
}
