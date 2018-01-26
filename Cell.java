package petri;

public class Cell {
	private class Position {
		// This subclass is meant to contain the position vector and related methods
		private double x, y;
		public Position() {
			x = 0;
			y = 0;
		}
		public Position(double a, double b) {
			x = a;
			y = b;
		}
		public double dist(Position other) {
			return Math.sqrt(Math.abs(Math.pow( (x - other.getX()), 2) + Math.pow( (y - other.getY()), 2)));
		}
		public double getX() {
			return x;
		}
		public double getY() {
			return y;
		}
		// test method
	}
	
	public double calcLight(Position pos) {
		//this is where the amount of light is calculated
		return Math.log(pos.dist(new Position(0.0, 0.0)));		
	}
	// TODO constructor
	// TODO test method
}
