using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FlowGuardAdmin.Pages;

public class AlertsModel : PageModel
{
    private readonly FirestoreDb _db;
    public AlertsModel(FirestoreDb db) => _db = db;
    public List<AlertDoc> Alerts { get; set; } = new();

    public async Task OnGetAsync()
    {
        var snap = await _db.Collection("alerts").OrderByDescending("createdAt").GetSnapshotAsync();
        Alerts = snap.Documents.Select(d => { var a = d.ConvertTo<AlertDoc>(); a.Id = d.Id; return a; }).ToList();
    }

    public async Task<IActionResult> OnPostCreateAsync(string title, string area, double? lat, double? lng)
    {
        await _db.Collection("alerts").AddAsync(new Dictionary<string, object?>
        {
            ["title"] = title, ["area"] = area, ["status"] = "Active",
            ["lat"] = lat, ["lng"] = lng, ["createdAt"] = Timestamp.GetCurrentTimestamp()
        });
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostToggleAsync(string id, string status)
    {
        await _db.Collection("alerts").Document(id)
            .UpdateAsync("status", status == "Active" ? "Resolved" : "Active");
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostDeleteAsync(string id)
    {
        await _db.Collection("alerts").Document(id).DeleteAsync();
        return RedirectToPage();
    }
}
