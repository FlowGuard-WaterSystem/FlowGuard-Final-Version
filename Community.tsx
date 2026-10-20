import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { C, Card, Head, Input, Btn, Press, Tag, Empty } from "./ui";

// Same shape the admin portal (Community.cshtml) reads and writes:
// posts/{id}            { uid, name, isAdmin, area, text, createdAt }
// posts/{id}/comments/{id}  { uid, name, isAdmin, text, createdAt }

const when = (t: any) => (t?.seconds ? new Date(t.seconds * 1000).toLocaleString() : "just now");

function Msg({ m, small }: any) {
  return (
    <View style={{ marginBottom: small ? 8 : 0 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
        <Text style={{ fontWeight: "700", color: C.text, marginRight: 8 }}>{m.name || "Resident"}</Text>
        {m.isAdmin && <Tag label="Municipality" color={C.blue} />}
        {m.area && <Tag label={m.area} color={C.mute} />}
      </View>
      <Text style={{ color: C.text }}>{m.text}</Text>
      <Text style={{ color: C.mute, fontSize: 11, marginTop: 4 }}>{when(m.createdAt)}</Text>
    </View>
  );
}

function Post({ post, user, name, delay }: any) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    const q = query(collection(db, "posts", post.id, "comments"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (s) => setComments(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [open, post.id]);

  const reply = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, "posts", post.id, "comments"), { uid: user.uid, name, isAdmin: false, text: text.trim(), createdAt: serverTimestamp() });
    setText("");
  };
  const remove = () =>
    Alert.alert("Delete post", "This removes your post for everyone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDoc(doc(db, "posts", post.id)) },
    ]);

  return (
    <Card delay={delay}>
      <Msg m={post} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
        <Press onPress={() => setOpen(!open)} style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="chatbubble-outline" size={18} color={C.blue} />
          <Text style={{ color: C.blue, fontWeight: "600", marginLeft: 6 }}>{open ? "Hide replies" : "Replies"}</Text>
        </Press>
        {post.uid === user.uid && (
          <Press onPress={remove}><Ionicons name="trash-outline" size={18} color={C.red} /></Press>
        )}
      </View>
      {open && (
        <View style={{ marginTop: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: C.pale }}>
          {comments.map((c) => <Msg key={c.id} m={c} small />)}
          {!comments.length && <Text style={{ color: C.mute, marginBottom: 8 }}>No replies yet.</Text>}
          <Input placeholder="Write a reply" value={text} onChangeText={setText} />
          <Btn label="Reply" onPress={reply} disabled={!text.trim()} />
        </View>
      )}
    </Card>
  );
}

export default function Community({ user, profile, onBack }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const name = profile?.name || (user.isAnonymous ? "Guest" : "Resident");
  const userArea = profile?.area?.trim(); // Get the user's area

  useEffect(() => {
    if (!userArea) return; 

    // Filter posts by the user's area
    const q = query(
      collection(db, "posts"),
      where("area", "==", userArea),
      orderBy("createdAt", "desc")
    );
    
    return onSnapshot(q, (s) => setPosts(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [userArea]); // Re-run when area changes

  const send = async () => {
    if (!text.trim()) return;
    if (!userArea) {
      Alert.alert("Set your area", "Please go to the Profile tab and set your area before posting.");
      return;
    }
    await addDoc(collection(db, "posts"), {
      uid: user.uid,
      name: anonymous ? "Anonymous" : name,
      isAdmin: false,
      area: userArea, // Attach the area to the post
      text: text.trim(),
      createdAt: serverTimestamp()
    });
    setText("");
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Head title="Community" onBack={onBack} />
      
      {!userArea ? (
        <Empty icon="location-outline" text="Please set your area in your Profile to see community posts for your neighborhood." />
      ) : (
        <>
          <Input placeholder="Share an update or ask your neighbours" multiline value={text} onChangeText={setText} style={{ height: 80, textAlignVertical: "top" }} />
          <Press onPress={() => setAnonymous(!anonymous)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}>
            <Ionicons name={anonymous ? "checkbox" : "square-outline"} size={20} color={C.blue} />
            <Text style={{ color: C.text, marginLeft: 8 }}>Post anonymously</Text>
          </Press>
          {anonymous && <Text style={{ color: C.mute, fontSize: 12, marginBottom: 8 }}>Your name will appear as Anonymous. Your account remains linked to the post so you can manage it.</Text>}
          <Btn label="Post" onPress={send} disabled={!text.trim()} />
          
          {posts.map((p, i) => <Post key={p.id} post={p} user={user} name={name} delay={i * 60} />)}
          {!posts.length && <Empty icon="chatbubbles-outline" text="No posts yet in your area. Start the conversation." />}
        </>
      )}
    </ScrollView>
  );
}
