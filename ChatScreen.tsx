import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import { createClient } from "@supabase/supabase-js";
import { C, Head } from "./ui";

const SUPABASE_URL = "https://bckoqwjbxaqezxilagfo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJja29xd2pieGFxZXp4aWxhZ2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODUzNTgsImV4cCI6MjEwNzY2MTM1OH0.JKVOLRSA0GiqOlYq9FYDrBywQb6w3lFS5is_fhIHkqg";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function ChatScreen({ onBack, profile, alerts, issues }: any) {
  const [messages, setMessages] = useState<IMessage[]>([
    {
      _id: "welcome",
      text: "Hi! I'm FlowGuard AI. Ask me about water alerts, schedules, or ask me to help you report an issue.",
      createdAt: new Date(),
      user: { _id: "ai", name: "FlowGuard AI" },
    },
  ]);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    setMessages((prev) => GiftedChat.append(prev, newMessages));

    const userText = newMessages[0].text;
    const apiMessages = [{ role: "user" as const, content: userText }];

    // Extract live context from the app's database to send to the AI
    const activeAlerts = alerts.filter((a: any) => a.status === "Active").map((a: any) => `${a.title} in ${a.area}`);
    const myReports = issues.map((i: any) => `${i.type}: ${i.details} (Status: ${i.status})`);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { 
          messages: apiMessages,
          context: {
            area: profile?.area || "Unknown",
            activeAlerts: activeAlerts.length ? activeAlerts : ["No active alerts"],
            userReports: myReports.length ? myReports : ["No reports filed yet"]
          }
        },
      });

      if (error) throw error;

      const aiMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
        text: data?.reply ?? "I didn't get a response.",
        createdAt: new Date(),
        user: { _id: "ai", name: "FlowGuard AI" },
      };
      setMessages((prev) => GiftedChat.append(prev, [aiMessage]));
        } catch (error: any) {
      console.error("Chat error:", error);
      
      // Extract the real error from the Edge Function response
      if (error.context && error.context.json) {
        try {
          const errorBody = await error.context.json();
          console.error("Detailed Supabase Error:", errorBody.error);
        } catch (e) {}
      }

      const errorMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
        text: "Sorry, I couldn't get a response. Please try again.",
        createdAt: new Date(),
        user: { _id: "ai", name: "FlowGuard AI" },
      };
      setMessages((prev) => GiftedChat.append(prev, [errorMessage]));
    }
    
  }, [alerts, issues, profile]);

  return (
    <View style={styles.container}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Head title="FlowGuard AI" onBack={onBack} />
      </View>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: "guest" }}
        placeholder="Ask about water or reporting an issue..."
        alwaysShowSend
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.pale },
});