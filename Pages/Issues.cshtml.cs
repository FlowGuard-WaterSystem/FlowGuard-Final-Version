using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FlowGuardAdmin.Pages;

public class IssuesModel : PageModel
{
    private readonly FirestoreDb _db;
    public IssuesModel(FirestoreDb db) => _db = db;
    public List<IssueDoc> Issues { get; set; } = new();

    public async Task OnGetAsync()
    {
        var snap = await _db.Collection("issues").GetSnapshotAsync();
        Issues = snap.Documents.Select(d => { var x = d.ConvertTo<IssueDoc>(); x.Id = d.Id; return x; })
            .OrderByDescending(i => i.CreatedAt?.ToDateTime() ?? DateTime.MinValue).ToList();
    }

    public async Task<IActionResult> OnPostUpdateAsync(string id, string status)
    {
        await _db.Collection("issues").Document(id).UpdateAsync("status", status);
        return RedirectToPage();
    }
}
