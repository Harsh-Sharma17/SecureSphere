document.addEventListener("DOMContentLoaded", () => {

  const form = document.querySelector("form");
  if (!form) return;

  // ================= REGISTER =================
  if (window.location.pathname.includes("register")) {

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = form.querySelector('input[type="email"]').value;
      const password = form.querySelector('input[type="password"]').value;

      if (!email || !password) {
        alert("Fill all fields");
        return;
      }

      try {
        // 🔐 Create auth user (Trigger will insert into users table)
        const { data, error } = await db.auth.signUp({
          email,
          password
        });

        if (error) {
          alert(error.message);
          return;
        }

        // ❗ No manual insert here (trigger handles it)

        alert("Registered successfully! Please login.");
        window.location.href = "login";

      } catch (err) {
        console.error(err);
        alert("Registration failed ❌");
      }
    });
  }

  // ================= LOGIN =================
  if (window.location.pathname.includes("login")) {

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = form.querySelector('input[type="email"]').value;
      const password = form.querySelector('input[type="password"]').value;

      if (!email || !password) {
        alert("Fill all fields");
        return;
      }

      try {
        // 🔐 Login
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

        // 🔥 FETCH ROLE FROM users TABLE
        const { data: userRow, error: roleError } = await db
          .from("users")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (roleError || !userRow) {
          console.error("User role error:", roleError);
          alert("User record not found ❌ (Trigger issue)");
          return;
        }

        // ✅ REDIRECT BASED ON ROLE
        if (userRow.is_admin) {
          window.location.href = "admin";
        } else {
          window.location.href = "dashboard";
        }

      } catch (err) {
        console.error(err);
        alert("Login failed ❌");
      }
    });
  }

});