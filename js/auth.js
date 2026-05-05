document.addEventListener("DOMContentLoaded", () => {

  // ================= REGISTER =================
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = registerForm.querySelector('input[type="email"]').value;
      const password = registerForm.querySelector('input[type="password"]').value;

      if (!email || !password) {
        alert("Fill all fields");
        return;
      }

      try {
        const { data, error } = await db.auth.signUp({
          email,
          password
        });

        if (error) {
          alert(error.message);
          return;
        }

        alert("Registered successfully! Please login.");
        window.location.href = "login.html";

      } catch (err) {
        console.error(err);
        alert("Registration failed ❌");
      }
    });
  }

  // ================= LOGIN =================
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      console.log("Login form submitted ✅");

      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;

      if (!email || !password) {
        alert("Fill all fields");
        return;
      }

      try {
        const { data, error } = await db.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          alert("Login failed: " + error.message);
          return;
        }

        const user = data.user;
        console.log("Logged in:", user.id);

        // 🔥 Fetch role
        const { data: userRow, error: roleError } = await db
          .from("users")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (roleError || !userRow) {
          console.error("User role error:", roleError);
          alert("User record not found ❌");
          return;
        }

        // ✅ Redirect
        if (userRow.is_admin) {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }

      } catch (err) {
        console.error(err);
        alert("Login failed ❌");
      }
    });
  }

});