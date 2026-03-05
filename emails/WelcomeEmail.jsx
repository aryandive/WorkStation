import {
    Body, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components";
import * as React from "react";

export const WelcomeEmail = () => (
    <Html>
        <Head>
            <style>{`
        .feature-item { margin-bottom: 10px; padding-left: 25px; position: relative; color: #ededed; }
        .feature-item:before { content: '✓'; position: absolute; left: 0; color: #4ade80; }
      `}</style>
        </Head>
        <Preview>Welcome to the zone, Friend.</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={header}>
                    <Text style={logo}>SyncFlowState</Text>
                </Section>
                <Section style={content}>
                    <Heading style={h1}>Welcome to the zone, Friend.</Heading>
                    <Text style={p}>Hey there,</Text>
                    <Text style={p}>
                        I'm Aryan, the creator of <strong>SyncFlowState</strong>. You’ve just taken the first step toward reclaiming your focus and mastering your time.
                    </Text>
                    <Section style={featureList}>
                        <Text className="feature-item"> Organize your daily tasks with precision</Text>
                        <Text className="feature-item"> Dive into deep work with our focus scenes</Text>
                        <Text className="feature-item"> Log your journey in the minimalist journal</Text>
                    </Section>
                    <Section style={personalNote}>
                        <Text style={noteText}>
                            A quick personal note from me to you: This project was made with love from more than a year of my hard work—growing from a simple mini-project into a fully established commercial SaaS. I truly hope you love it.
                        </Text>
                        <Text style={noteText}>
                            I have kept in mind the smallest details that most developers ignore just to release quickly on the market. It’s not perfect yet, but it’s growing and getting better day after day.
                        </Text>
                    </Section>
                    <Section style={btnContainer}>
                        <Link href="https://syncflowstate.com/" style={button}>Go to your SyncFlowState</Link>
                    </Section>
                    <Text style={p}>Stay focused,<br /><strong>Aryan</strong><br />Founder, SyncFlowState</Text>
                </Section>
            </Container>
        </Body>
    </Html>
);

// Styles
const main = { backgroundColor: "#0a0a0a", color: "#ededed", fontFamily: "sans-serif" };
const container = { maxWidth: "600px", margin: "0 auto", backgroundColor: "#111111", border: "1px solid #333" };
const header = { padding: "40px 20px", textAlign: "center", background: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)" };
const logo = { fontSize: "24px", fontWeight: "bold", color: "#fff" };
const content = { padding: "40px" };
const h1 = { fontSize: "24px", color: "#fff" };
const p = { color: "#a1a1a1", lineHeight: "1.6" };
const personalNote = { backgroundColor: "#1a1a1a", borderLeft: "3px solid #fff", padding: "20px", margin: "20px 0" };
const noteText = { color: "#d1d1d1", fontStyle: "italic", fontSize: "14px" };
const btnContainer = { textAlign: "center", margin: "30px 0" };
const button = { backgroundColor: "#fff", color: "#000", padding: "12px 30px", borderRadius: "5px", fontWeight: "bold", textDecoration: "none" };
const featureList = { margin: "20px 0" };