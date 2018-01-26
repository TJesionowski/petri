package petri;

public class Position {
	private double x;
	private double y;

	public Position() {
		setX(0);
		setY(0);
	}
	public Position(double a, double b) {
		setX(a);
		setY(b);
	}

	public double getX() {
		return x;
	}

	public void setX(double x) {
		this.x = x;
	}

	public double getY() {
		return y;
	}

	public void setY(double y) {
		this.y = y;
	}
	public double dist(Position other) {
		return Math.sqrt(Math.abs(Math.pow( (getX() - other.getX()), 2) + Math.pow( (getY() - other.getY()), 2)));
	}
}