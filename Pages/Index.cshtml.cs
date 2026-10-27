using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FlowGuardAdmin.Pages;

public class IndexModel : PageModel
{
    private readonly FirestoreDb _db;
    public IndexModel(FirestoreDb db) => _db = db;

    public int ActiveAlerts, TotalIssues, Pending, InProgress, Resolved;
    public List<IssueDoc> Latest { get; set; } = new();

    public async Task OnGetAsync()
    {
        var alerts = await _db.Collection("alerts").GetSnapshotAsync();
        ActiveAlerts = alerts.Documents.Count(d => d.TryGetValue<string>("status", out var st) && st == "Active");

        var issues = (await _db.Collection("issues").GetSnapshotAsync()).Documents
            .Select(d => { var x = d.ConvertTo<IssueDoc>(); x.Id = d.Id; return x; }).ToList();
        TotalIssues = issues.Count;
        Pending = issues.Count(i => i.Status == "Pending");
        InProgress = issues.Count(i => i.Status == "In Progress");
        Resolved = issues.Count(i => i.Status == "Resolved");
        Latest = issues.OrderByDescending(i => i.CreatedAt?.ToDateTime() ?? DateTime.MinValue).Take(5).ToList();
    }
}
