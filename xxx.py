import math
import sys
import random
import pygame

# -------------------------------------------------------------------------
# CONSTANTS & PALETTE
# -------------------------------------------------------------------------
WIDTH, HEIGHT = 900, 680
FPS = 60

COLOR_BG = (10, 14, 26)
COLOR_CARD_BG = (18, 24, 42)
COLOR_CARD_BORDER = (45, 58, 92)

COLOR_STAR_CORE = (255, 255, 240)
COLOR_STAR = (255, 205, 70)
COLOR_STAR_GLOW = (255, 160, 40)

COLOR_PLANET = (80, 170, 245)
COLOR_PLANET_DARK = (20, 24, 38)
COLOR_PINK = (255, 105, 180)

COLOR_GRAPH_BG = (14, 18, 32)
COLOR_GRAPH_GRID = (32, 42, 68)
COLOR_GRAPH_LINE = (0, 235, 185)
COLOR_GRAPH_DIP = (255, 95, 125)
COLOR_TEXT = (225, 235, 250)
COLOR_TEXT_DIM = (130, 145, 175)
COLOR_ACCENT = (100, 180, 255)

# -------------------------------------------------------------------------
# INITIALIZATION
# -------------------------------------------------------------------------
pygame.init()
pygame.font.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Exoplanet Transit & Light Curve Simulation")
clock = pygame.time.Clock()

font_title = pygame.font.SysFont("Segoe UI", 20, bold=True)
font_body = pygame.font.SysFont("Segoe UI", 15)
font_small = pygame.font.SysFont("Segoe UI", 12)
font_mono = pygame.font.SysFont("Consolas", 14, bold=True)

# Generate background starfield
random.seed(42)
background_stars = [
    (random.randint(0, WIDTH), random.randint(0, HEIGHT), random.uniform(0.5, 2.0), random.randint(120, 255))
    for _ in range(90)
]

def create_star_glow(radius):
    surf_size = radius * 6
    glow_surf = pygame.Surface((surf_size, surf_size), pygame.SRCALPHA)
    center = surf_size // 2
    for r in range(surf_size // 2, 0, -2):
        alpha = int(90 * (1.0 - (r / (surf_size // 2)) ** 0.5) ** 1.8)
        color = (255, 170, 40, max(0, min(255, alpha)))
        pygame.draw.circle(glow_surf, color, (center, center), r)
    return glow_surf

# -------------------------------------------------------------------------
# SIMULATION PARAMETERS
# -------------------------------------------------------------------------
star_x, star_y = WIDTH // 2, 210
star_r = 52

orbit_a = 280  # semi-major axis (X)
orbit_b = 55   # semi-minor axis (Y - inclination)
planet_r = 16

theta = 0.0
orbit_speed = 0.022
paused = False

max_history = 350
brightness_history = []  # list of (brightness_val, is_transiting)

# Cache glow surface
star_glow_surf = create_star_glow(star_r)

# -------------------------------------------------------------------------
# MAIN LOOP
# -------------------------------------------------------------------------
running = True
while running:
    # 1. Event Handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                running = False
            elif event.key == pygame.K_SPACE:
                paused = not paused
            elif event.key == pygame.K_UP:
                orbit_speed = min(0.08, orbit_speed + 0.005)
            elif event.key == pygame.K_DOWN:
                orbit_speed = max(0.005, orbit_speed - 0.005)
            elif event.key in (pygame.K_PLUS, pygame.K_EQUALS):
                planet_r = min(35, planet_r + 2)
            elif event.key in (pygame.K_MINUS, pygame.K_UNDERSCORE):
                planet_r = max(8, planet_r - 2)

    # 2. Update Physics
    if not paused:
        theta = (theta + orbit_speed) % (2 * math.pi)

    # 3D Orbit coordinates projected on 2D view
    px = star_x + orbit_a * math.cos(theta)
    py = star_y + orbit_b * math.sin(theta)
    z_depth = math.sin(theta)  # positive when in front of star plane

    in_front = z_depth > 0
    dist_2d = math.hypot(px - star_x, py - star_y)

    # Calculate Transit & Brightness Dip
    is_transiting = False
    is_occulted = False
    brightness_val = 1.0
    max_dip = (planet_r / star_r) ** 2  # Area ratio blocked

    if in_front:
        if dist_2d < (star_r + planet_r):
            is_transiting = True
            if dist_2d <= abs(star_r - planet_r):
                # Full transit (planet completely within star disc)
                overlap = 1.0
            else:
                # Ingress / Egress partial overlap approximation
                overlap = (star_r + planet_r - dist_2d) / (2.0 * planet_r)
                overlap = max(0.0, min(1.0, overlap))
            brightness_val = 1.0 - (max_dip * overlap)
    else:
        # Behind the star (Occultation / Secondary Eclipse)
        if dist_2d < (star_r - 4):
            is_occulted = True

    # Record history for Light Curve plot
    if not paused or len(brightness_history) == 0:
        brightness_history.append((brightness_val, is_transiting))
        if len(brightness_history) > max_history:
            brightness_history.pop(0)

    # ---------------------------------------------------------------------
    # 3. RENDER / DRAW
    # ---------------------------------------------------------------------
    screen.fill(COLOR_BG)

    # Background Stars
    for sx, sy, srad, salpha in background_stars:
        s_color = (salpha, salpha, min(255, salpha + 20))
        pygame.draw.circle(screen, s_color, (sx, sy), int(srad))

    # Draw Orbit Trajectory (Ellipse)
    orbit_rect = pygame.Rect(star_x - orbit_a, star_y - orbit_b, orbit_a * 2, orbit_b * 2)
    pygame.draw.ellipse(screen, (38, 48, 76), orbit_rect, 1)

    # Draw Planet when BEHIND the star
    if not in_front and not is_occulted:
        # Scale planet slightly by depth for 3D depth cue
        draw_r = max(4, int(planet_r * (0.85 + 0.15 * ((z_depth + 1) / 2))))
        pygame.draw.circle(screen, COLOR_PLANET, (int(px), int(py)), draw_r)
        # Planet shadow phase
        shadow_surf = pygame.Surface((draw_r * 2, draw_r * 2), pygame.SRCALPHA)
        pygame.draw.circle(shadow_surf, (0, 0, 0, 140), (draw_r + 3, draw_r), draw_r)
        screen.blit(shadow_surf, (int(px) - draw_r, int(py) - draw_r))

    # Draw Star Glow & Star Disc
    glow_pos = (star_x - star_glow_surf.get_width() // 2, star_y - star_glow_surf.get_height() // 2)
    screen.blit(star_glow_surf, glow_pos, special_flags=pygame.BLEND_ADD)

    pygame.draw.circle(screen, COLOR_STAR, (star_x, star_y), star_r)
    pygame.draw.circle(screen, COLOR_STAR_CORE, (star_x, star_y), int(star_r * 0.7))

    # Draw Planet when IN FRONT of the star
    if in_front:
        draw_r = max(4, int(planet_r * (0.9 + 0.15 * ((z_depth + 1) / 2))))
        if is_transiting:
            # Silhouette planet against star
            pygame.draw.circle(screen, COLOR_PLANET_DARK, (int(px), int(py)), draw_r)
            pygame.draw.circle(screen, (150, 200, 255), (int(px), int(py)), draw_r, 1)
        else:
            # Lit planet
            pygame.draw.circle(screen, COLOR_PLANET, (int(px), int(py)), draw_r)
            # Subtle atmosphere / rim highlight
            pygame.draw.circle(screen, (170, 220, 255), (int(px) - 2, int(py) - 2), int(draw_r * 0.6), 1)

    # ---------------------------------------------------------------------
    # 4. LIGHT CURVE GRAPH PANEL
    # ---------------------------------------------------------------------
    gx, gy, gw, gh = 50, 430, WIDTH - 100, 190
    pygame.draw.rect(screen, COLOR_CARD_BG, (gx, gy, gw, gh), border_radius=8)
    pygame.draw.rect(screen, COLOR_CARD_BORDER, (gx, gy, gw, gh), width=1, border_radius=8)

    # Graph plot inner area
    plot_x, plot_y, plot_w, plot_h = gx + 60, gy + 35, gw - 80, gh - 65
    pygame.draw.rect(screen, COLOR_GRAPH_BG, (plot_x, plot_y, plot_w, plot_h))
    pygame.draw.rect(screen, COLOR_GRAPH_GRID, (plot_x, plot_y, plot_w, plot_h), 1)

    # Graph Title & Axis Labels
    title_surf = font_body.render("REAL-TIME TRANSIT PHOTOMETRY (LIGHT CURVE)", True, COLOR_ACCENT)
    screen.blit(title_surf, (plot_x, gy + 10))

    # Y-axis Range: 1.05 (top) to (1.0 - max_dip * 1.35) (bottom)
    min_y_val = max(0.65, 1.0 - max(0.12, max_dip * 1.4))
    max_y_val = 1.03

    def val_to_y(v):
        norm = (v - min_y_val) / (max_y_val - min_y_val)
        return plot_y + plot_h - int(norm * plot_h)

    # Draw Horizontal Grid Lines & Y-ticks
    for gv in [1.02, 1.00, 1.0 - max_dip, min_y_val + 0.02]:
        gy_line = val_to_y(gv)
        if plot_y <= gy_line <= plot_y + plot_h:
            pygame.draw.line(screen, COLOR_GRAPH_GRID, (plot_x, gy_line), (plot_x + plot_w, gy_line), 1)
            tick_lbl = font_small.render(f"{gv:.3f}", True, COLOR_TEXT_DIM)
            screen.blit(tick_lbl, (gx + 12, gy_line - 8))

    # Baseline 1.0 reference line
    y_1_0 = val_to_y(1.0)
    pygame.draw.line(screen, (60, 80, 120), (plot_x, y_1_0), (plot_x + plot_w, y_1_0), 1)

    # Draw Flux points and line
    if len(brightness_history) > 1:
        points = []
        for i, (b_val, trans) in enumerate(brightness_history):
            pt_x = plot_x + int(i * (plot_w / max_history))
            pt_y = val_to_y(b_val)
            pt_y = max(plot_y, min(plot_y + plot_h, pt_y))
            points.append((pt_x, pt_y, trans))

        for i in range(len(points) - 1):
            p1, p2 = points[i], points[i + 1]
            line_col = COLOR_GRAPH_DIP if (p1[2] or p2[2]) else COLOR_GRAPH_LINE
            pygame.draw.line(screen, line_col, (p1[0], p1[1]), (p2[0], p2[1]), 2)

        # Draw current cursor point
        cur_pt = points[-1]
        cur_color = COLOR_PINK if cur_pt[2] else (255, 255, 100)
        pygame.draw.circle(screen, cur_color, (cur_pt[0], cur_pt[1]), 4)

    # X-axis label
    x_lbl = font_small.render("Time / Orbit Phase  -->", True, COLOR_TEXT_DIM)
    screen.blit(x_lbl, (plot_x + plot_w - 130, plot_y + plot_h + 8))

    y_axis_title = font_small.render("Relative Flux", True, COLOR_TEXT_DIM)
    screen.blit(y_axis_title, (gx + 5, gy + 12))

    # ---------------------------------------------------------------------
    # 5. TOP HUD & TELEMETRY
    # ---------------------------------------------------------------------
    header_surf = font_title.render("EXOPLANET TRANSIT SIMULATOR", True, COLOR_TEXT)
    screen.blit(header_surf, (30, 20))

    sub_surf = font_body.render("Star: Solar-type (G2V)  |  Exoplanet: Gas Giant", True, COLOR_TEXT_DIM)
    screen.blit(sub_surf, (30, 48))

    # Status Badge
    status_x, status_y = WIDTH - 260, 20
    if is_transiting:
        status_text = "TRANSIT IN PROGRESS"
        status_color = (255, 80, 110)
    elif is_occulted:
        status_text = "OCCULTATION (BEHIND)"
        status_color = (130, 150, 200)
    else:
        status_text = "OUT OF TRANSIT"
        status_color = (70, 210, 150)

    pygame.draw.rect(screen, (22, 28, 48), (status_x - 10, status_y - 4, 240, 28), border_radius=6)
    pygame.draw.rect(screen, status_color, (status_x - 10, status_y - 4, 240, 28), width=1, border_radius=6)
    stat_surf = font_small.render(status_text, True, status_color)
    screen.blit(stat_surf, (status_x + 10, status_y + 2))

    # Telemetry data readouts
    phase = (theta / (2 * math.pi))
    telemetry = [
        f"Relative Flux: {brightness_val:.4f}",
        f"Transit Depth (Max): {max_dip * 100:.2f}%",
        f"Orbit Phase: {phase:.2f}",
        f"Planet Radius: {planet_r} px | Star: {star_r} px",
    ]
    for idx, text in enumerate(telemetry):
        t_surf = font_mono.render(text, True, COLOR_TEXT)
        screen.blit(t_surf, (WIDTH - 270, 60 + idx * 20))

    # Interactive Controls Footer
    ctrl_str = "[SPACE] Pause/Resume   [UP/DOWN] Speed   [+/-] Planet Size   [ESC] Exit"
    ctrl_surf = font_small.render(ctrl_str, True, COLOR_TEXT_DIM)
    screen.blit(ctrl_surf, (WIDTH // 2 - ctrl_surf.get_width() // 2, HEIGHT - 25))

    # Display update & tick
    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()
sys.exit()
