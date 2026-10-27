using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FlowGuardAdmin.Pages;

public record SupplyRow(string Id, string Area, string Day, string Time);

public class SupplyModel : PageModel
{
    private readonly FirestoreDb _db;
    public SupplyModel(FirestoreDb db) => _db = db;
    public List<SupplyRow> Schedule { get; set; } = new();

    public async Task OnGetAsync()
    {
        var snap = await _db.Collection("schedule").GetSnapshotAsync();
        Schedule = snap.Documents.Select(d => new SupplyRow(
            d.Id,
            d.TryGetValue<string>("area", out var area) ? area : "",
            d.TryGetValue<string>("day", out var day) ? day : "",
            d.TryGetValue<string>("time", out var time) ? time : ""))
            .OrderBy(x => x.Area).ToList();
    }

    public async Task<IActionResult> OnPostCreateAsync(string area, string day, string time)
    {
        if (string.IsNullOrWhiteSpace(area) || string.IsNullOrWhiteSpace(day) || string.IsNullOrWhiteSpace(time))
        {
            TempData["Error"] = "Enter an area, days, and supply hours.";
            return RedirectToPage();
        }
        await _db.Collection("schedule").AddAsync(new Dictionary<string, object>
        {
            ["area"] = area.Trim(), ["day"] = day.Trim(), ["time"] = time.Trim()
        });
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostUpdateAsync(string id, string area, string day, string time)
    {
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(area) || string.IsNullOrWhiteSpace(day) || string.IsNullOrWhiteSpace(time))
        {
            TempData["Error"] = "Complete all schedule fields before saving.";
            return RedirectToPage();
        }
        await _db.Collection("schedule").Document(id).UpdateAsync(new Dictionary<string, object>
        {
            ["area"] = area.Trim(), ["day"] = day.Trim(), ["time"] = time.Trim()
        });
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostDeleteAsync(string id)
    {
        if (!string.IsNullOrWhiteSpace(id)) await _db.Collection("schedule").Document(id).DeleteAsync();
        return RedirectToPage();
    }
}
