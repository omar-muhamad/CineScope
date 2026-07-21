describe("Login page (magic link)", () => {
  // Runs against the cypress.config baseUrl (Vite on :5173); the magic-link
  // send is stubbed so no mailbox or database is needed.
  beforeEach(() => {
    cy.visit("/login");
  });

  it("shows the passwordless sign-in form", () => {
    cy.get('[data-test-id="login-heading"]').should(
      "have.text",
      "Sign in to CineScope",
    );
    cy.get('[data-test-id="google-signin"]').should("exist");
    cy.get('[data-test-id="auth-email"]').should("exist");
    // No password fields anywhere.
    cy.get('input[type="password"]').should("not.exist");
  });

  it("sends a magic link and shows the sent panel", () => {
    cy.intercept("POST", "/api/auth/sign-in/magic-link", {
      statusCode: 200,
      body: { status: true },
    }).as("sendMagicLink");

    cy.get('[data-test-id="auth-email"]').type("someone@example.com");
    cy.get('[data-test-id="auth-submit"]').click();

    cy.wait("@sendMagicLink")
      .its("request.body.email")
      .should("eq", "someone@example.com");
    cy.get('[data-test-id="magic-sent"]').should("be.visible");
    cy.contains("someone@example.com");
  });

  it("lets the user go back and use a different email", () => {
    cy.intercept("POST", "/api/auth/sign-in/magic-link", {
      statusCode: 200,
      body: { status: true },
    });

    cy.get('[data-test-id="auth-email"]').type("someone@example.com");
    cy.get('[data-test-id="auth-submit"]').click();
    cy.get('[data-test-id="magic-change-email"]').click();

    cy.get('[data-test-id="auth-email"]').should("exist");
  });
});
