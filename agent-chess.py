# 2 LLMs playing chess with each other
import openai
from dotenv import load_dotenv
import os
import re

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
# example Updated board state: r7/3b2pp/2n5/2Q1k3/4P1b1/8/P7/5K2 b - - 4 27
regex = r"Updated board state: (\w+)"

def print_moves_ordered(player1_moves, player2_moves):
  print("| Player 1|")
  print("|----------|")
  for move in player1_moves:
    print(f"| {move} |")
    print("|----------|")
  print("| Player 2|")
  print("|----------|")
  for move in player2_moves:
    print(f"| {move} |")
    print("|----------|")
  print("|----------|")


def print_chess_board(fen):
    piece_symbols = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
    }
    board_part = fen.split()[0]
    rows = board_part.split('/')
    print("  +------------------------+")
    for i, row in enumerate(rows):
        line = []
        for c in row:
            if c.isdigit():
                line.extend(['.'] * int(c))
            else:
                line.append(piece_symbols.get(c, c))
        print(f"{8 - i} | {' '.join(line)} |")
    print("  +------------------------+")
    print("    a b c d e f g h")

player1_prompt = (
    "You are an expert chess player (Player 1, White). Given the current board state, make your move. "
    "Respond with:\n"
    "Move (e.g., e2e4)\n"
    "Updated board state (FEN)\n"
    "Status: win, lose, draw, or still playing\n"
    "No extra text."
)

player2_prompt = (
    "You are an expert chess player (Player 2, Black). Given the current board state, make your move. "
    "Respond with:\n"
    "Move (e.g., e2e4)\n"
    "Updated board state (FEN)\n"
    "Status: win, lose, draw, or still playing\n"
    "No extra text."
)

player1_moves = []
player2_moves = []
# This string is the FEN (Forsyth-Edwards Notation) representation of the initial chess board state.
# It describes the position of all pieces, whose turn it is, castling rights, en passant target, halfmove clock, and fullmove number.
# Breakdown:
# "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR" - Piece placement (from 8th rank to 1st rank)
# "w" - White to move
# "KQkq" - Both sides can castle both sides (K=White kingside, Q=White queenside, k=Black kingside, q=Black queenside)
# "-" - No en passant target square
# "0" - Halfmove clock (for 50-move rule)
# "1" - Fullmove number (starts at 1)
board_state = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

print_chess_board(board_state)
print("\n")

while True:
    player1_response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": player1_prompt + "\n\nBoard state: " + board_state}],
    )
    move, board_state, status = player1_response.choices[0].message.content.split("\n")
    board_state = board_state.strip()
    print("player1 board_state", board_state)
    board_state = re.search(regex, board_state).group(1) if re.search(regex, board_state) else board_state
    print_chess_board(board_state)
    print("\n")
    player1_moves.append(move)
    if "lose" in status:
        print("Player 1 lost the game. Player 2 won the game")
        break
    if "win" in status:
        print("Player 1 won the game. Player 2 lost the game")
        break
    if "draw" in status:
        print("Game is a draw")
        break
    player2_response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": player2_prompt + "\n\nBoard state: " + board_state}],
    )
    move, board_state, status = player2_response.choices[0].message.content.split("\n")
    board_state = board_state.strip()
    print("\nplayer2 board_state", board_state)
    board_state = re.search(regex, board_state).group(1) if re.search(regex, board_state) else board_state
    print_chess_board(board_state)
    print("\n")
    player2_moves.append(move)
    if "lose" in status:
        print("Player 2 lost the game. Player 1 won the game")
        break
    if "win" in status:
        print("Player 2 won the game. Player 1 lost the game")
        break
    if "draw" in status:
        print("Game is a draw")
        break

print("\n\n***********Analyzing the Moves**************\n\n")
print_moves_ordered(player1_moves, player2_moves)    