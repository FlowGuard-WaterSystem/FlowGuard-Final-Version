using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FlowGuardAdmin.Pages;

public record InfrastructureRow(string Id, string Title, string Area, string Status, string Detail);

public class InfrastructureModel : PageModel
{
    private readonly FirestoreDb _db;
    public InfrastructureModel(FirestoreDb db) => _db = db;
    public List<InfrastructureRow> Projects { get; set; } = new();
    private static readonly string[] Statuses = ["Planned", "In progress", "Completed"];

    public async Task OnGetAsync()
    {
        var snap = await _db.Collection("infrastructure").GetSnapshotAsync();
        Projects = snap.Documents.Select(d => new InfrastructureRow(
            d.Id,
            d.TryGetValue<string>("title", out var title) ? title : "",
            d.TryGetValue<string>("area", out var area) ? area : "",
            d.TryGetValue<string>("status", out var status) ? status : "Planned",
            d.TryGetValue<string>("detail", out var detail) ? detail : ""))
            .OrderBy(x => x.Title).ToList();
    }

    public async Task<IActionResult> OnPostCreateAsync(string title, string area, string status, string detail)
    {
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(area) || !Statuses.Contains(status) || string.IsNullOrWhiteSpace(detail))
        {
            TempData["Error"] = "Complete all fields and choose a valid status.";
            return RedirectToPage();
        }
        await _db.Collection("infrastructure").AddAsync(new Dictionary<string, object>
        {
            ["title"] = title.Trim(), ["area"] = area.Trim(), ["status"] = status,
            ["detail"] = detail.Trim(), ["createdAt"] = Timestamp.GetCurrentTimestamp()
        });
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostUpdateAsync(string id, string status, string detail)
    {
        if (string.IsNullOrWhiteSpace(id) || !Statuses.Contains(status) || string.IsNullOrWhiteSpace(detail))
        {
            TempData["Error"] = "Choose a valid status and enter an update.";
            return RedirectToPage();
        }
        await _db.Collection("infrastructure").Document(id).UpdateAsync(new Dictionary<string, object>
        {
            ["status"] = status, ["detail"] = detail.Trim()
        });
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostDeleteAsync(string id)
    {
        if (!string.IsNullOrWhiteSpace(id)) await _db.Collection("infrastructure").Document(id).DeleteAsync();
        return RedirectToPage();
    }
}
