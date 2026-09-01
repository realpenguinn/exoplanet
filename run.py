"""
================================================================================
EXOPLANET TRANSIT PHOTOMETRY & HABITABLE WORLD ANALYZER (TOP TIER PRO)
Master Project Launcher & Presentation Suite
================================================================================
"""

import os
import sys
import webbrowser
import subprocess
import time

def print_banner():
    banner = r"""
====================================================================================
  _____ _  __ ____  _____  _               _   _ ______ _______ 
 | ____| |/ // __ \|  __ \| |        /\   | \ | |  ____|__   __|
 | |__ | ' /| |  | | |__) | |       /  \  |  \| | |__     | |   
 |  __||  < | |  | |  ___/| |      / /\ \ | . ` |  __|    | |   
 | |___| . \| |__| | |    | |____ / ____ \| |\  | |____   | |   
 |______\_|\_\\____/|_|    |______/_/    \_\_| \_|______|  |_|   
          DATA ANALYZER & HABITABLE WORLD CLASSIFIER (PRO)
====================================================================================
 [NASA Kepler / TESS Transit Photometry • JWST Atmospheric Spectroscopy]
====================================================================================
"""
    print(banner)

def get_base_dir():
    return os.path.dirname(os.path.abspath(__file__))

def launch_web():
    index_path = os.path.join(get_base_dir(), "index.html")
    print(f"\n[+] Opening Master Web Interactive Dashboard: {index_path}")
    webbrowser.open(f"file:///{index_path.replace(os.sep, '/')}")

def launch_analyzer():
    analyzer_path = os.path.join(get_base_dir(), "analyzer.py")
    print(f"\n[+] Executing Python Astrophysics Pipeline: {analyzer_path}\n")
    subprocess.run([sys.executable, analyzer_path])

def launch_pygame():
    pygame_path = os.path.join(get_base_dir(), "xxx.py")
    print(f"\n[+] Launching 60 FPS Pygame Simulation: {pygame_path}\n")
    subprocess.run([sys.executable, pygame_path])

def launch_guide():
    guide_path = os.path.join(get_base_dir(), "SCIENCE_FAIR_GUIDE.md")
    print(f"\n[+] Opening Science Fair Presentation Guide & Speaking Script...")
    if sys.platform == "win32":
        os.system(f'start "" "{guide_path}"')
    else:
        webbrowser.open(f"file:///{guide_path.replace(os.sep, '/')}")

def main():
    print_banner()
    
    # Auto open dashboard on start
    launch_web()
    
    while True:
        print("\n" + "-" * 70)
        print("  SCIENCE FAIR INTERACTIVE CONTROL MENU:")
        print("-" * 70)
        print("  [1] Open Web Dashboard (3D Transit, JWST Spectrum, Astrobiology Dossier)")
        print("  [2] Run Python Data Science Analyzer (Generates 4-Panel Research Chart)")
        print("  [3] Run Desktop 60 FPS Pygame Simulation")
        print("  [4] Open Science Fair Presentation Guide & Judge Speaking Script")
        print("  [5] Run Full Exhibition Suite (Web + Data Pipeline + Pygame)")
        print("  [0] Exit Launcher")
        print("-" * 70)
        
        try:
            choice = input("\nEnter your choice (0-5) [default: 1]: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Good luck at your science fair!")
            break
            
        if choice == "" or choice == "1":
            launch_web()
        elif choice == "2":
            launch_analyzer()
        elif choice == "3":
            launch_pygame()
        elif choice == "4":
            launch_guide()
        elif choice == "5":
            launch_analyzer()
            launch_web()
            launch_pygame()
        elif choice == "0":
            print("\nExiting. Best of luck at your science fair exhibition tomorrow!")
            break
        else:
            print("\nInvalid selection. Please choose between 0 and 5.")

if __name__ == "__main__":
    main()
