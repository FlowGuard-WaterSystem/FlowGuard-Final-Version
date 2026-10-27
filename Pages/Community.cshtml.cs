using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FlowGuardAdmin.Pages;

public record Msg(string Id, string Name, string Text, bool IsAdmin, string When, List<Msg> Comments);

public class CommunityModel : PageModel
{
    private readonly FirestoreDb _db;
    public CommunityModel(FirestoreDb db) => _db = db;
    public List<Msg> Posts { get; set; } = new();

    static Msg ToMsg(DocumentSnapshot d, List<Msg>? c = null)
    {
        d.TryGetValue<string>("name", out var name);
        d.TryGetValue<string>("text", out var text);
        d.TryGetValue<bool>("isAdmin", out var adm);
        var when = d.TryGetValue<Timestamp>("createdAt", out var t) ? t.ToDateTime().ToLocalTime().ToString("g") : "";
        return new Msg(d.Id, name ?? "", text ?? "", adm, when, c ?? new());
    }

    public async Task OnGetAsync()
    {
        var snap = await _db.Collection("posts").OrderByDescending("createdAt").GetSnapshotAsync();
        foreach (var d in snap.Documents)
        {
            var cs = await d.Reference.Collection("comments").OrderBy("createdAt").GetSnapshotAsync();
            Posts.Add(ToMsg(d, cs.Documents.Select(x => ToMsg(x)).ToList()));
        }
    }

    private Dictionary<string, object> Make(string text) => new()
    {
        ["uid"] = User.Identity?.Name ?? "admin", ["name"] = "Municipality", ["isAdmin"] = true,
        ["text"] = text, ["createdAt"] = Timestamp.GetCurrentTimestamp()
    };

    public async Task<IActionResult> OnPostPostAsync(string text)
    { await _db.Collection("posts").AddAsync(Make(text)); return RedirectToPage(); }

    public async Task<IActionResult> OnPostReplyAsync(string id, string text)
    { await _db.Collection("posts").Document(id).Collection("comments").AddAsync(Make(text)); return RedirectToPage(); }

    public async Task<IActionResult> OnPostDeleteAsync(string id)
    { await _db.Collection("posts").Document(id).DeleteAsync(); return RedirectToPage(); }
}