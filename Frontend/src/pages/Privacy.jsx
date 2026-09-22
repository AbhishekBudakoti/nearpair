import LegalPageLayout, { Section, legalListClass } from "../components/LegalPageLayout";

const Privacy = () => {
  return (
    <LegalPageLayout title="Privacy Policy" updated="September 22, 2026">
      <Section heading="Overview">
        <p>
          This policy explains what information NearPair collects when you use the
          app, why we collect it, and who can see it. NearPair helps people find
          nearby partners for sports, hobbies, and other activities — most of what
          we collect exists to make that matching work well and keep it safe.
        </p>
      </Section>

      <Section heading="Information we collect">
        <p><strong>Account information:</strong> name, email address, and password (stored as a
          one-way hash, never in plain text). If you sign up with Google, we
          receive your name, email, and Google account id instead of a password.
          You may optionally add gender, date of birth, and phone number.</p>
        <p><strong>Profile information:</strong> a photo, short bio, the activities you're
          interested in with your skill level for each, your weekly availability,
          and your city and location.</p>
        <p><strong>Activity on the app:</strong> partner requests you send or receive, chat
          messages, sessions you plan with a match, reviews and ratings you give
          or receive, and any report you file or that's filed about you.</p>
      </Section>

      <Section heading="How we use it">
        <ul className={legalListClass}>
          <li>To rank and show you compatible partners, and show your profile to them</li>
          <li>To power chat and let you plan sessions with people you've matched with</li>
          <li>To calculate ratings and show a fair match score</li>
          <li>To keep you signed in, using a single authentication cookie</li>
          <li>To review reports and keep the community safe, including suspending accounts that break our rules</li>
        </ul>
      </Section>

      <Section heading="Location data">
        <p>
          We ask for your location so we can rank partners by distance. Other
          users only ever see an <strong>approximate</strong> location — rounded to roughly a
          kilometer — never your exact coordinates or address. We store the exact
          point only to calculate that distance.
        </p>
      </Section>

      <Section heading="What other users can see">
        <p>
          Anyone you're matched with (or who shows up in search results) can see
          your name, photo, bio, activities and skill levels, availability, city,
          approximate location, and rating. Your email, exact location, and date
          of birth are never shown to other users.
        </p>
      </Section>

      <Section heading="Cookies">
        <p>
          We use one essential cookie to keep you signed in — no advertising or
          tracking cookies. See our{" "}
          <a href="/cookies" className="text-neutral-900 font-semibold underline decoration-yellow-400 decoration-2">
            Cookie Policy
          </a>{" "}
          for details.
        </p>
      </Section>

      <Section heading="Sharing">
        <p>
          We don't sell your personal information, and we don't share it with
          advertisers. Your profile is shared with other users as a normal part
          of how matching works. We may share information with service providers
          who help us run NearPair (like hosting), under confidentiality
          obligations, or if required by law.
        </p>
      </Section>

      <Section heading="Data retention">
        <p>
          We keep your information for as long as your account is active.
          If you'd like your account and data deleted, contact us and we'll take
          care of it.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can update or remove most of your profile information at any time
          from your Profile page. For anything else — access, corrections, or
          deleting your account — contact us and we'll help.
        </p>
      </Section>

      <Section heading="Age requirement">
        <p>
          NearPair is meant for adults. You must be at least 18 years old to
          create an account.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          If we make meaningful changes to this policy, we'll update the date at
          the top of this page.
        </p>
      </Section>
    </LegalPageLayout>
  );
};

export default Privacy;
