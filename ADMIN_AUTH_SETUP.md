# Admin panel sign-in setup

The admin pages now require a signed-in admin account. Credentials are stored in each developer's .NET user-secrets store, not in the repository or `appsettings.json`. Each teammate can have their own username and password.

## Add the first admin account

Open PowerShell in the folder containing `FlowGuardAdmin.csproj`, then run:

```powershell
dotnet user-secrets set "Admin:Accounts:0:Username" "your-admin-name" --project FlowGuardAdmin.csproj
dotnet user-secrets set "Admin:Accounts:0:Password" "your-long-unique-password" --project FlowGuardAdmin.csproj
```

For an additional admin, use the next index (`1`, then `2`, and so on):

```powershell
dotnet user-secrets set "Admin:Accounts:1:Username" "teammate-name" --project FlowGuardAdmin.csproj
dotnet user-secrets set "Admin:Accounts:1:Password" "a-different-long-password" --project FlowGuardAdmin.csproj
```

Set each person's password privately. Don't paste real passwords into source files, GitHub, or group chats.

## Start and sign in

```powershell
dotnet run --project FlowGuardAdmin.csproj
```

Open `https://localhost:7080/Login`. The first visit may show a local development certificate warning; use the HTTPS address configured in `Properties/launchSettings.json`.

Successful sign-in creates an HttpOnly, HTTPS-only authentication cookie that expires after eight hours. All Razor Pages require authentication; sign out from the button in the top navigation.

The existing Firebase service-account setup is still required for the dashboard's Firestore data. Keep its JSON key out of Git and share access through the team's approved secret-management method.
