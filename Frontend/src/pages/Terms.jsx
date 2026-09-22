import LegalPageLayout, { Section, legalListClass } from "../components/LegalPageLayout";

const Terms = () => {
  return (
    <LegalPageLayout title="Terms of Service" updated="September 22, 2026">
      <Section heading="Agreement to these terms" boxed>
        <p>
          By creating an account or using NearPair, you agree to these terms.
          If you don't agree with them, please don't use the app.
        </p>
      </Section>

      <Section heading="Who can use NearPair" boxed>
        <p>
          You must be at least 18 years old and able to form a binding contract
          to use NearPair. You're responsible for the accuracy of the
          information on your account and for keeping your password confidential.
        </p>
      </Section>

      <Section heading="Acceptable use" boxed>
        <p>When using NearPair, you agree not to:</p>
        <ul className={legalListClass}>
          <li>Harass, threaten, or abuse other users</li>
          <li>Create a fake profile or impersonate someone else</li>
          <li>Use the app for spam, solicitation, or anything illegal</li>
          <li>Ask another user for money or attempt to defraud them</li>
          <li>Post content that's hateful, sexually explicit, or infringes someone else's rights</li>
        </ul>
        <p>
          We review reports filed against accounts, and may issue a warning,
          temporarily suspend, or permanently remove any account that breaks
          these rules.
        </p>
      </Section>

      <Section heading="Meeting other users" boxed>
        <p>
          NearPair helps you find people nearby to do an activity with — what
          happens when you actually meet is between you and them. We don't run
          background checks on users and can't guarantee anyone's identity,
          behavior, or intentions. Please read our{" "}
          <a href="/safety" className="text-neutral-900 font-semibold underline decoration-yellow-400 decoration-2">
            Safety &amp; Trust
          </a>{" "}
          page before meeting a match in person, and use your own judgment —
          meet in public first, tell someone where you're going, and trust your
          instincts.
        </p>
      </Section>

      <Section heading="Your content" boxed>
        <p>
          You keep ownership of the photos, bio, messages, and reviews you post.
          By posting them, you give NearPair permission to display them within
          the app as needed to operate the service (for example, showing your
          photo to a match). You're responsible for what you post, and it must
          be your own or something you have the right to share.
        </p>
      </Section>

      <Section heading="Reviews and ratings" boxed>
        <p>
          Reviews should reflect a real session you actually had with the person
          you're reviewing. We may remove a review that's fake, abusive, or
          unrelated to an actual session.
        </p>
      </Section>

      <Section heading="Suspension and termination" boxed>
        <p>
          We may suspend or terminate an account that violates these terms, with
          or without notice depending on severity. You can stop using NearPair
          at any time; contact us if you'd like your account removed entirely.
        </p>
      </Section>

      <Section heading="Disclaimers" boxed>
        <p>
          NearPair is provided "as is." We don't guarantee you'll find a match,
          that a match will show up, or that any particular outcome will happen
          from using the app.
        </p>
      </Section>

      <Section heading="Limitation of liability" boxed>
        <p>
          To the fullest extent the law allows, NearPair isn't liable for
          disputes between users, anything that happens at an in-person meetup,
          or indirect or consequential damages arising from your use of the app.
        </p>
      </Section>

      <Section heading="Changes to these terms" boxed>
        <p>
          If we update these terms in a meaningful way, we'll update the date
          at the top of this page.
        </p>
      </Section>

      <Section heading="Governing law" boxed>
        <p>
          These terms are governed by the laws of [insert governing
          jurisdiction] — this placeholder should be filled in before relying on
          this page.
        </p>
      </Section>
    </LegalPageLayout>
  );
};

export default Terms;
