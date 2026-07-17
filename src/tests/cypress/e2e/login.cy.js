describe("Login page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5173/login");
  });

  it("shows the sign-in form", () => {
    cy.get('[data-test-id="login-heading"]').should(
      "have.text",
      "Sign in to CineScope",
    );
    cy.get('[data-test-id="auth-email"]').should("exist");
    cy.get('[data-test-id="auth-password"]').should("exist");
  });

  it("switches to the registration form", () => {
    cy.get('[data-test-id="switch-to-register"]').click();
    cy.get('[data-test-id="login-heading"]').should(
      "have.text",
      "Create your account",
    );
  });

  it("rejects bad credentials", () => {
    // Requires the API server (npm run dev:server) with a reachable database.
    cy.get('[data-test-id="auth-email"]').type("nobody@example.com");
    cy.get('[data-test-id="auth-password"]').type("wrong-password-1");
    cy.get('[data-test-id="auth-submit"]').click();
    cy.get('[data-test-id="auth-error"]').should("be.visible");
  });
});
