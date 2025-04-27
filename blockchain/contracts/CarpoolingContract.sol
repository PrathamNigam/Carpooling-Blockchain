pragma solidity ^0.8.0;

contract CarpoolingContract {
    struct Ride {
        uint256 id;
        address payable driver;
        uint256 seats;
        uint256 availableSeats;
        uint256 pricePerSeat;
        string origin;
        string destination;
        uint256 departureTime;
        bool active;
    }

    struct Booking {
        uint256 id;
        uint256 rideId;
        address passenger;
        uint256 seats;
        bool paid;
        bool refunded;
    }

    uint256 private rideCounter;
    uint256 private bookingCounter;
    mapping(uint256 => Ride) public rides;
    mapping(uint256 => Booking) public bookings;
    mapping(address => uint256[]) public userRides;
    mapping(address => uint256[]) public userBookings;

    event RideCreated(uint256 indexed rideId, address indexed driver, uint256 departureTime);
    event RideBooked(uint256 indexed bookingId, uint256 indexed rideId, address indexed passenger, uint256 seats);
    event RideCancelled(uint256 indexed rideId);
    event BookingCancelled(uint256 indexed bookingId, uint256 indexed rideId);
    event PaymentCompleted(uint256 indexed bookingId, uint256 amount);
    event RideCompleted(uint256 indexed rideId, address indexed driver, uint256 amount);

    modifier onlyDriver(uint256 _rideId) {
        require(rides[_rideId].driver == msg.sender, "Only the driver can perform this action");
        _;
    }

    modifier onlyPassenger(uint256 _bookingId) {
        require(bookings[_bookingId].passenger == msg.sender, "Only the passenger can perform this action");
        _;
    }

    function createRide(
        uint256 _seats,
        uint256 _pricePerSeat,
        string memory _origin,
        string memory _destination,
        uint256 _departureTime
    ) external returns (uint256) {
        require(_seats > 0, "Seats must be greater than zero");
        require(_departureTime > block.timestamp, "Departure time must be in the future");

        uint256 rideId = rideCounter++;
        
        rides[rideId] = Ride({
            id: rideId,
            driver: payable(msg.sender),
            seats: _seats,
            availableSeats: _seats,
            pricePerSeat: _pricePerSeat,
            origin: _origin,
            destination: _destination,
            departureTime: _departureTime,
            active: true
        });

        userRides[msg.sender].push(rideId);
        
        emit RideCreated(rideId, msg.sender, _departureTime);
        return rideId;
    }

    function bookRide(uint256 _rideId, uint256 _seats) external payable returns (uint256) {
        Ride storage ride = rides[_rideId];
        
        require(ride.active, "Ride is not active");
        require(ride.driver != msg.sender, "Driver cannot book their own ride");
        require(_seats > 0, "Seats must be greater than zero");
        require(_seats <= ride.availableSeats, "Not enough seats available");
        require(ride.departureTime > block.timestamp, "Ride has already departed");
        require(msg.value >= ride.pricePerSeat * _seats, "Insufficient payment");

        uint256 bookingId = bookingCounter++;
        
        bookings[bookingId] = Booking({
            id: bookingId,
            rideId: _rideId,
            passenger: msg.sender,
            seats: _seats,
            paid: true,
            refunded: false
        });

        ride.availableSeats -= _seats;
        userBookings[msg.sender].push(bookingId);
        
        emit RideBooked(bookingId, _rideId, msg.sender, _seats);
        return bookingId;
    }

    function completeRide(uint256 _rideId) external onlyDriver(_rideId) {
    Ride storage ride = rides[_rideId];
    require(ride.active, "Ride is already completed or cancelled");
    require(block.timestamp >= ride.departureTime, "Ride has not yet departed");
    
    // Mark ride as inactive first
    ride.active = false;
    
    // Calculate payment amount
    uint256 totalSeats = ride.seats;
    uint256 bookedSeats = totalSeats - ride.availableSeats;
    uint256 totalAmount = bookedSeats * ride.pricePerSeat;
    
    // Transfer funds if there are any
    if (totalAmount > 0 && address(this).balance >= totalAmount) {
        bool success = ride.driver.send(totalAmount);
        require(success, "Payment transfer failed");
    }
    
    // Emit event
    emit RideCompleted(_rideId, ride.driver, totalAmount);
}

    function cancelRide(uint256 _rideId) external onlyDriver(_rideId) {
        Ride storage ride = rides[_rideId];
        require(ride.active, "Ride is already completed or cancelled");
        require(ride.departureTime > block.timestamp, "Cannot cancel a ride that has already departed");
        
        ride.active = false;
        
        emit RideCancelled(_rideId);
        
        // Process refunds for all passengers
        // In a production app, you'd need to iterate through bookings for this ride
        // This is simplified for brevity
    }

    function cancelBooking(uint256 _bookingId) external onlyPassenger(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        Ride storage ride = rides[booking.rideId];
        
        require(booking.paid && !booking.refunded, "Booking is not eligible for refund");
        require(ride.departureTime > block.timestamp, "Cannot cancel after departure time");
        
        booking.refunded = true;
        ride.availableSeats += booking.seats;
        
        // Refund the passenger
        uint256 refundAmount = ride.pricePerSeat * booking.seats;
        payable(msg.sender).transfer(refundAmount);
        
        emit BookingCancelled(_bookingId, booking.rideId);
    }

    function getUserRides() external view returns (uint256[] memory) {
        return userRides[msg.sender];
    }

    function getUserBookings() external view returns (uint256[] memory) {
        return userBookings[msg.sender];
    }

    function getRideDetails(uint256 _rideId) external view returns (
        address driver,
        uint256 seats,
        uint256 availableSeats,
        uint256 pricePerSeat,
        string memory origin,
        string memory destination,
        uint256 departureTime,
        bool active
    ) {
        Ride storage ride = rides[_rideId];
        return (
            ride.driver,
            ride.seats,
            ride.availableSeats,
            ride.pricePerSeat,
            ride.origin,
            ride.destination,
            ride.departureTime,
            ride.active
        );
    }
}