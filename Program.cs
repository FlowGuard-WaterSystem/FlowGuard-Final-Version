using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Authentication;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

// Service-account key lets the server read/write Firestore as admin
var cred = cfg["Firebase:CredentialsPath"];
if (!string.IsNullOrEmpty(cred))
    Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", Path.GetFullPath(cred));

builder.Services.AddSingleton(FirestoreDb.Create(cfg["Firebase:ProjectId"]!));
builder.Services.AddHttpClient();
builder.Services.AddAuthentication("Cookies").AddCookie("Cookies", o =>
{
    o.LoginPath = "/Login";
    o.ExpireTimeSpan = TimeSpan.FromHours(8);
});
builder.Services.AddAuthorization();
builder.Services.AddRazorPages(o =>
{
    o.Conventions.AuthorizeFolder("/");
    o.Conventions.AllowAnonymousToPage("/Login");
});

var app = builder.Build();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapRazorPages();
app.MapPost("/logout", async (HttpContext ctx) =>
{
    await ctx.SignOutAsync("Cookies");
    return Results.Redirect("/Login");
}).RequireAuthorization();
app.Run();
