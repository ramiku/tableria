$basePath = "c:\xampp\htdocs\tableria\apps\web\src\i18n"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

$es = @'
{
  "app": {
    "name": "Tableria",
    "tagline": "Tu plataforma de juegos de mesa",
    "language": "Idioma",
    "documentTitle": "Tableria — juegos de mesa online"
  },
  "nav": {
    "explore": "Explorar",
    "rooms": "Salas públicas",
    "friends": "Amigos",
    "rankings": "Rankings",
    "tournaments": "Torneos"
  },
  "auth": {
    "login": {
      "title": "Entra en tu cuenta",
      "subtitle": "Vuelve a la mesa con tus amigos",
      "identifier": "Nick o correo",
      "password": "Contraseña",
      "submit": "Entrar",
      "submitting": "Entrando…",
      "genericError": "No se pudo iniciar sesión",
      "forgot": "¿Olvidaste tu contraseña?",
      "noAccount": "¿No tienes cuenta?",
      "register": "Regístrate"
    },
    "register": {
      "title": "Crea tu cuenta",
      "subtitle": "Nick, correo y contraseña — así de simple",
      "username": "Nick",
      "usernamePattern": "Solo letras, números y guion bajo",
      "email": "Correo electrónico",
      "password": "Contraseña",
      "passwordHint": "Mínimo 10 caracteres.",
      "submit": "Crear cuenta",
      "submitting": "Creando cuenta…",
      "genericError": "No se pudo crear la cuenta",
      "hasAccount": "¿Ya tienes cuenta?",
      "signIn": "Entra"
    },
    "forgot": {
      "title": "Recupera tu contraseña",
      "subtitle": "Te enviaremos un enlace para restablecerla",
      "email": "Correo electrónico",
      "submit": "Enviar enlace",
      "submitting": "Enviando…",
      "sentTitle": "Revisa tu correo",
      "sentBody": "Si esa cuenta existe, te hemos enviado un enlace para restablecer la contraseña. Caduca en 1 hora.",
      "backToSignIn": "Volver a entrar"
    },
    "reset": {
      "title": "Elige una contraseña nueva",
      "subtitle": "Mínimo 10 caracteres",
      "password": "Contraseña nueva",
      "confirm": "Repite la contraseña",
      "submit": "Guardar contraseña",
      "submitting": "Guardando…",
      "mismatch": "Las contraseñas no coinciden",
      "invalidTitle": "Enlace no válido",
      "invalidBody": "Solicita un nuevo enlace de recuperación.",
      "invalidCta": "Solicitar enlace",
      "genericError": "No se pudo restablecer la contraseña"
    }
  },
  "rail": {
    "activity": "Actividad",
    "friendsRooms": "Salas de amigos",
    "friendsOnline": "Amigos",
    "empty": "Nada por aquí todavía",
    "createRoom": "Crear sala nueva"
  },
  "explore": {
    "greetingMorning": "Buenos días, {{name}}",
    "greetingAfternoon": "Buenas tardes, {{name}}",
    "greetingEvening": "Buenas noches, {{name}}",
    "headline": "¿A qué jugamos hoy?",
    "searchPlaceholder": "Buscar juego...",
    "createRoom": "Crear sala",
    "catalog": "Catálogo",
    "soon": "Próximamente",
    "filterAll": "Todos",
    "filterBoard": "Tablero",
    "filterCards": "Cartas",
    "emptySearch": "Ningún juego coincide con esa búsqueda."
  },
  "rooms": {
    "title": "Salas públicas",
    "comingIn": "— llega en {{milestone}}."
  },
  "friends": {
    "title": "Amigos",
    "comingIn": "— llega en {{milestone}}."
  },
  "rankings": {
    "title": "Rankings",
    "comingIn": "— llega en {{milestone}}."
  },
  "tournaments": {
    "title": "Torneos",
    "comingIn": "— llega en {{milestone}}."
  },
  "game": {
    "notFound": "Juego no encontrado",
    "badge": {
      "new": "Nuevo",
      "soon": "Pronto"
    },
    "status": {
      "playing": "{{count}} jugando",
      "coming": "Próximamente"
    },
    "category": {
      "board": "Tablero",
      "cards": "Cartas"
    },
    "detailEmpty": "Ficha del juego — lobby de mesas en {{milestone}}.",
    "milestoneM2": "M2",
    "milestoneM3": "M3",
    "milestoneM5": "M5"
  },
  "common": { "soon": "Próximamente" },
  "sidebar": {
    "status": {
      "online": "Conectado"
    },
    "aria": {
      "profile": "Ajustes de perfil",
      "logout": "Cerrar sesión",
      "mainNav": "Navegación principal"
    }
  },
  "presence": {
    "online": "Disponible",
    "away": "Ausente",
    "offline": "Desconectado"
  },
  "friendRow": {
    "chatWith": "Chatear con {{name}}"
  },
  "invite": {
    "title": "Invita a tus amigos",
    "body": "Comparte tu enlace y jugad en la misma sala en segundos.",
    "copy": "Copiar enlace",
    "copied": "¡Copiado!"
  },
  "theme": {
    "toggle": {
      "toLight": "Cambiar a tema claro",
      "toDark": "Cambiar a tema oscuro"
    }
  },
  "continueBanner": {
    "title": "Continúa donde lo dejaste",
    "with": "con",
    "yourTurn": "te toca a ti",
    "resume": "Reanudar"
  },
  "demo": {
    "games": {
      "ticTacToe": "3 en raya",
      "connect4": "Conecta 4",
      "reversi": "Reversi",
      "rummy": "Rummy",
      "oca": "Oca",
      "mus": "Mus",
      "settlers": "Colonos"
    },
    "banner": {
      "game": "Colonos",
      "with": "Marta y 2 más",
      "turn": "Turno 14"
    },
    "matches": {
      "timeAgo": {
        "twoHoursAgo": "hace 2 h",
        "yesterday": "ayer",
        "threeDaysAgo": "hace 3 d",
        "fiveDaysAgo": "hace 5 d"
      }
    },
    "achievements": {
      "firstGame": { "name": "Primera partida", "desc": "Juega tu primera partida" },
      "winStreak3": { "name": "Racha de 3", "desc": "Gana tres partidas seguidas" },
      "ticTacToeMaster": { "name": "Maestro del 3 en raya", "desc": "10 victorias en 3 en raya" },
      "social": { "name": "Social", "desc": "Añade a tu primer amigo" },
      "invincible": { "name": "Invencible", "desc": "Gana 5 partidas seguidas" },
      "collector": { "name": "Coleccionista", "desc": "Juega a 3 juegos distintos" },
      "tournament": { "name": "Torneo", "desc": "Apúntate a un torneo" },
      "legend": { "name": "Leyenda", "desc": "Llega al top 10 del ranking" }
    }
  },
  "profile": {
    "title": "Tu perfil",
    "tabsAria": "Secciones del perfil",
    "memberSince": "Miembro desde {{date}}",
    "statusOnline": "En línea",
    "tabs": {
      "account": "Cuenta",
      "friends": "Amigos",
      "matches": "Partidas",
      "achievements": "Logros"
    },
    "account": {
      "identity": "Identidad",
      "security": "Seguridad",
      "fields": {
        "username": "Nick",
        "displayName": "Nombre visible",
        "email": "Correo",
        "joinedAt": "Alta"
      },
      "changePassword": "Cambiar contraseña",
      "currentPassword": "Contraseña actual",
      "newPassword": "Nueva contraseña",
      "confirmPassword": "Repite la nueva contraseña",
      "savePassword": "Guardar contraseña",
      "comingSoon": "La edición del perfil llega en M1."
    },
    "friends": {
      "summary": "Tienes {{count}} amigos en línea",
      "requests": "Solicitudes pendientes",
      "manage": "Gestionar amigos",
      "wantsToBe": "quiere ser tu amigo",
      "accept": "Aceptar",
      "reject": "Rechazar"
    },
    "matches": {
      "stats": "Estadísticas",
      "statsPlayed": "Jugadas",
      "statsWins": "Victorias",
      "statsLosses": "Derrotas",
      "statsDraws": "Empates",
      "recent": "Últimas partidas",
      "resultWin": "Victoria",
      "resultLoss": "Derrota",
      "resultDraw": "Empate",
      "vs": "vs {{name}}",
      "empty": "Aún no has jugado partidas."
    },
    "achievements": {
      "unlocked": "Conseguido",
      "locked": "Bloqueado",
      "empty": "Los logros se desbloquean al jugar."
    },
    "language": {
      "section": "Idioma",
      "helper": "Elige el idioma de la plataforma. Se aplica al instante.",
      "validation": {
        "required": "Rellena los tres campos.",
        "minLength": "La nueva contraseña debe tener al menos 8 caracteres.",
        "mismatch": "La nueva contraseña no coincide.",
        "updated": "Contraseña actualizada (demo)."
      }
    }
  }
}
'@

$en = @'
{
  "app": {
    "name": "Tableria",
    "tagline": "Your board game platform",
    "language": "Language",
    "documentTitle": "Tableria — online board games"
  },
  "nav": {
    "explore": "Explore",
    "rooms": "Public rooms",
    "friends": "Friends",
    "rankings": "Rankings",
    "tournaments": "Tournaments"
  },
  "auth": {
    "login": {
      "title": "Sign in to your account",
      "subtitle": "Get back to the table with your friends",
      "identifier": "Username or email",
      "password": "Password",
      "submit": "Sign in",
      "submitting": "Signing in…",
      "genericError": "Could not sign you in",
      "forgot": "Forgot your password?",
      "noAccount": "Don't have an account?",
      "register": "Sign up"
    },
    "register": {
      "title": "Create your account",
      "subtitle": "Pick a username, email and password — that's it",
      "username": "Username",
      "usernamePattern": "Only letters, numbers and underscore",
      "email": "Email",
      "password": "Password",
      "passwordHint": "At least 10 characters.",
      "submit": "Create account",
      "submitting": "Creating account…",
      "genericError": "Could not create the account",
      "hasAccount": "Already have an account?",
      "signIn": "Sign in"
    },
    "forgot": {
      "title": "Reset your password",
      "subtitle": "We'll email you a link to reset it",
      "email": "Email",
      "submit": "Send link",
      "submitting": "Sending…",
      "sentTitle": "Check your email",
      "sentBody": "If that account exists, we've sent a link to reset the password. It expires in 1 hour.",
      "backToSignIn": "Back to sign in"
    },
    "reset": {
      "title": "Choose a new password",
      "subtitle": "At least 10 characters",
      "password": "New password",
      "confirm": "Repeat the password",
      "submit": "Save password",
      "submitting": "Saving…",
      "mismatch": "The passwords don't match",
      "invalidTitle": "Invalid link",
      "invalidBody": "Request a new recovery link.",
      "invalidCta": "Request link",
      "genericError": "Could not reset the password"
    }
  },
  "rail": {
    "activity": "Activity",
    "friendsRooms": "Friends' rooms",
    "friendsOnline": "Friends",
    "empty": "Nothing here yet",
    "createRoom": "Create new room"
  },
  "explore": {
    "greetingMorning": "Good morning, {{name}}",
    "greetingAfternoon": "Good afternoon, {{name}}",
    "greetingEvening": "Good evening, {{name}}",
    "headline": "What shall we play today?",
    "searchPlaceholder": "Search a game...",
    "createRoom": "Create room",
    "catalog": "Catalog",
    "soon": "Coming soon",
    "filterAll": "All",
    "filterBoard": "Board",
    "filterCards": "Cards",
    "emptySearch": "No games match that search."
  },
  "rooms": {
    "title": "Public rooms",
    "comingIn": "— coming in {{milestone}}."
  },
  "friends": {
    "title": "Friends",
    "comingIn": "— coming in {{milestone}}."
  },
  "rankings": {
    "title": "Rankings",
    "comingIn": "— coming in {{milestone}}."
  },
  "tournaments": {
    "title": "Tournaments",
    "comingIn": "— coming in {{milestone}}."
  },
  "game": {
    "notFound": "Game not found",
    "badge": {
      "new": "New",
      "soon": "Soon"
    },
    "status": {
      "playing": "{{count}} playing",
      "coming": "Coming soon"
    },
    "category": {
      "board": "Board",
      "cards": "Cards"
    },
    "detailEmpty": "Game details — lobby of tables in {{milestone}}.",
    "milestoneM2": "M2",
    "milestoneM3": "M3",
    "milestoneM5": "M5"
  },
  "common": { "soon": "Coming soon" },
  "sidebar": {
    "status": {
      "online": "Online"
    },
    "aria": {
      "profile": "Profile settings",
      "logout": "Sign out",
      "mainNav": "Main navigation"
    }
  },
  "presence": {
    "online": "Online",
    "away": "Away",
    "offline": "Offline"
  },
  "friendRow": {
    "chatWith": "Chat with {{name}}"
  },
  "invite": {
    "title": "Invite your friends",
    "body": "Share your link and play together in seconds.",
    "copy": "Copy link",
    "copied": "Copied!"
  },
  "theme": {
    "toggle": {
      "toLight": "Switch to light theme",
      "toDark": "Switch to dark theme"
    }
  },
  "continueBanner": {
    "title": "Continue where you left off",
    "with": "with",
    "yourTurn": "your turn",
    "resume": "Resume"
  },
  "demo": {
    "games": {
      "ticTacToe": "Tic-tac-toe",
      "connect4": "Connect 4",
      "reversi": "Reversi",
      "rummy": "Rummy",
      "oca": "Goose game",
      "mus": "Mus",
      "settlers": "Settlers"
    },
    "banner": {
      "game": "Settlers",
      "with": "Marta and 2 more",
      "turn": "Turn 14"
    },
    "matches": {
      "timeAgo": {
        "twoHoursAgo": "2 hours ago",
        "yesterday": "yesterday",
        "threeDaysAgo": "3 days ago",
        "fiveDaysAgo": "5 days ago"
      }
    },
    "achievements": {
      "firstGame": { "name": "First game", "desc": "Play your first game" },
      "winStreak3": { "name": "3-win streak", "desc": "Win three games in a row" },
      "ticTacToeMaster": { "name": "Tic-tac-toe master", "desc": "10 wins at tic-tac-toe" },
      "social": { "name": "Social", "desc": "Add your first friend" },
      "invincible": { "name": "Undefeated", "desc": "Win 5 games in a row" },
      "collector": { "name": "Collector", "desc": "Play 3 different games" },
      "tournament": { "name": "Tournament", "desc": "Join a tournament" },
      "legend": { "name": "Legend", "desc": "Reach the top 10 of the ranking" }
    }
  },
  "profile": {
    "title": "Your profile",
    "tabsAria": "Profile sections",
    "memberSince": "Member since {{date}}",
    "statusOnline": "Online",
    "tabs": {
      "account": "Account",
      "friends": "Friends",
      "matches": "Matches",
      "achievements": "Achievements"
    },
    "account": {
      "identity": "Identity",
      "security": "Security",
      "fields": {
        "username": "Username",
        "displayName": "Display name",
        "email": "Email",
        "joinedAt": "Joined"
      },
      "changePassword": "Change password",
      "currentPassword": "Current password",
      "newPassword": "New password",
      "confirmPassword": "Repeat new password",
      "savePassword": "Save password",
      "comingSoon": "Profile editing arrives in M1."
    },
    "friends": {
      "summary": "You have {{count}} friends online",
      "requests": "Pending requests",
      "manage": "Manage friends",
      "wantsToBe": "wants to be your friend",
      "accept": "Accept",
      "reject": "Reject"
    },
    "matches": {
      "stats": "Stats",
      "statsPlayed": "Played",
      "statsWins": "Wins",
      "statsLosses": "Losses",
      "statsDraws": "Draws",
      "recent": "Recent matches",
      "resultWin": "Win",
      "resultLoss": "Loss",
      "resultDraw": "Draw",
      "vs": "vs {{name}}",
      "empty": "You haven't played any matches yet."
    },
    "achievements": {
      "unlocked": "Unlocked",
      "locked": "Locked",
      "empty": "Achievements unlock as you play."
    },
    "language": {
      "section": "Language",
      "helper": "Choose the platform language. It applies instantly.",
      "validation": {
        "required": "Fill in all three fields.",
        "minLength": "The new password must be at least 8 characters.",
        "mismatch": "The new password does not match.",
        "updated": "Password updated (demo)."
      }
    }
  }
}
'@

[System.IO.File]::WriteAllText("$basePath\es.json", $es, $utf8NoBom)
[System.IO.File]::WriteAllText("$basePath\en.json", $en, $utf8NoBom)

# Validar JSON
$esObj = Get-Content "$basePath\es.json" -Raw | ConvertFrom-Json
$enObj = Get-Content "$basePath\en.json" -Raw | ConvertFrom-Json
Write-Host "es.json top-level keys: $(($esObj.PSObject.Properties | ForEach-Object { $_.Name }) -join ', ')"
Write-Host "en.json top-level keys: $(($enObj.PSObject.Properties | ForEach-Object { $_.Name }) -join ', ')"
Write-Host "es.json size: $((Get-Item "$basePath\es.json").Length) bytes"
Write-Host "en.json size: $((Get-Item "$basePath\en.json").Length) bytes"
Write-Host "OK"
