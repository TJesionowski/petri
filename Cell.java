package petri;

public class Cell {

	public double calcLight(Position pos) {
		//this is where the amount of light is calculated
		return Math.log(pos.dist(new Position(0.0, 0.0)));// TODO add support for variable origin locations
	}
	// TODO constructor
	// TODO test method
}
