describe('Logging in and out as existing user', () => {

   // should be able to open a sign in form and then sign in with existing user
    it('should be able to open a sign in form and then sign in with existing user', () => {
        cy.visit('http://localhost:4000/');
        cy.get('button').contains('Sign In').click({force: true});
        cy.wait(2000);
        cy.get('#signInEmail').type('admin')
        cy.get('#signInPassword').type('KartulKartul')
        cy.get('#signInModal > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click({force: true});
        cy.wait(2000);
    });

  // should be able to sign out
    it('should be able to sign out', () => {
        cy.wait(2000);
        cy.get('button').contains('Sign Out', ).click();
        cy.wait(2000);

    });

});