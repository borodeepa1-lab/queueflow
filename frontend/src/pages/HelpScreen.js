import React from "react";

const faqGroups = [
  {
    title: "Participant FAQs",
    items: [
      {
        question: "How do I generate a token?",
        answer: "Select the live event, open Register, submit the form, and the system will generate your token."
      },
      {
        question: "How do I know my queue position?",
        answer: "Open Students and search by your name or token number to see position, status, and wait time."
      },
      {
        question: "What do the counter colors mean?",
        answer: "The list uses red, green, and orange counter tags so students can quickly identify their assigned counter."
      }
    ]
  },
  {
    title: "Admin FAQs",
    items: [
      {
        question: "Can multiple admins use the platform?",
        answer: "Yes. The UI is designed so each admin can host events and later view only their own event data and history."
      },
      {
        question: "What should the admin dashboard show?",
        answer: "Ongoing event details, queue analytics, queue actions, logs, and a separate event history list with PDF export."
      },
      {
        question: "Can I host events other than admissions?",
        answer: "Yes. The event model is presented as a reusable platform flow so the same frontend can support many event types."
      }
    ]
  }
];

function HelpScreen() {
  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Help center</p>
          <h2>FAQs for participants and event hosts</h2>
        </div>
        <p className="page-copy">
          This page explains how to use the platform from both sides: public registration and admin event hosting.
        </p>
      </section>

      <section className="grid grid--two">
        {faqGroups.map((group) => (
          <article key={group.title} className="panel-card">
            <div className="panel-card__header">
              <div>
                <p className="eyebrow">Support</p>
                <h3>{group.title}</h3>
              </div>
            </div>

            <div className="faq-list">
              {group.items.map((item) => (
                <article key={item.question} className="faq-item">
                  <strong>{item.question}</strong>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default HelpScreen;
