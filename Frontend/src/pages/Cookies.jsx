import LegalPageLayout, { Section } from "../components/LegalPageLayout";

const Cookies = () => {
  return (
    <LegalPageLayout title="Cookie Policy" updated="September 22, 2026">
      <Section heading="What this page covers">
        <p>
          Cookies are small pieces of data a site stores in your browser. This
          page explains the only cookie NearPair uses and why.
        </p>
      </Section>

      <Section heading="The cookie we use">
        <p>
          NearPair sets a single cookie, called <code>token</code>, when you log
          in. It's what keeps you signed in as you move around the app —
          without it, you'd have to log in again on every page. It's:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li><strong>Essential</strong> — the app can't recognize you as logged in without it</li>
          <li><strong>HttpOnly</strong> — it can't be read by page scripts, which helps protect it from theft</li>
          <li><strong>Temporary</strong> — it expires automatically after 7 days, or immediately when you log out</li>
        </ul>
      </Section>

      <Section heading="What we don't use">
        <p>
          We don't use advertising cookies, third-party tracking cookies, or
          analytics cookies that follow you across other sites.
        </p>
      </Section>

      <Section heading="Managing cookies">
        <p>
          Because our one cookie is essential to signing in, blocking it means
          you won't be able to stay logged in to NearPair. You can still control
          or clear cookies at any time from your browser's settings.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          If how we use cookies changes, we'll update the date at the top of
          this page.
        </p>
      </Section>
    </LegalPageLayout>
  );
};

export default Cookies;
