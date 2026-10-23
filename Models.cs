using Google.Cloud.Firestore;

[FirestoreData]
public class AlertDoc
{
    public string Id { get; set; } = "";
    [FirestoreProperty("title")] public string Title { get; set; } = "";
    [FirestoreProperty("area")] public string Area { get; set; } = "";
    [FirestoreProperty("status")] public string Status { get; set; } = "Active";
    [FirestoreProperty("lat")] public double? Lat { get; set; }
    [FirestoreProperty("lng")] public double? Lng { get; set; }
    [FirestoreProperty("createdAt")] public Timestamp? CreatedAt { get; set; }
}

[FirestoreData]
public class IssueDoc
{
    public string Id { get; set; } = "";
    [FirestoreProperty("type")] public string Type { get; set; } = "";
    [FirestoreProperty("details")] public string Details { get; set; } = "";
    [FirestoreProperty("status")] public string Status { get; set; } = "Pending";
    [FirestoreProperty("photoUrl")] public string? PhotoUrl { get; set; }
    [FirestoreProperty("lat")] public double? Lat { get; set; }
    [FirestoreProperty("lng")] public double? Lng { get; set; }
    [FirestoreProperty("createdAt")] public Timestamp? CreatedAt { get; set; }
}
