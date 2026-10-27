using Google.Cloud.Firestore;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

// Service-account key lets the server read and write Firestore.
var cred = cfg["Firebase:CredentialsPath"];
if (!string.IsNullOrEmpty(cred))
    Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", Path.GetFullPath(cred));

builder.Services.AddSingleton(FirestoreDb.Create(cfg["Firebase:ProjectId"]!));
builder.Services.AddRazorPages();

var app = builder.Build();
app.UseStaticFiles();
app.MapRazorPages();
app.MapGet("/Login", () => Results.Redirect("/"));
app.Run();
