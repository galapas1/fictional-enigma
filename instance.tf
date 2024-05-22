resource "aws_instance" "ami" {
  ami           = "ami-04d6c6d8ea42b4f1d"
  instance_type = "t2.small"

  tags = {
    Name = "${var.app_name}_cli_ec2"
  }
}

data "aws_instance" "ecfr_ec2" {
  filter {
    name   = "tag:Name"
    values = ["${var.app_name}_cli_ec2"]
  }

  depends_on = [
    aws_instance.ami
  ]
}

resource "aws_instance" "service" {
  ami                         = data.aws_instance.ecfr_ec2.ami
  vpc_security_group_ids      = ["${aws_security_group.service.id}"]
  subnet_id                   = module.vpc.public_subnets[0]
  instance_type               = aws_instance.ami.instance_type
  key_name                    = aws_key_pair.service.key_name
  associate_public_ip_address = true

  provisioner "remote-exec" {
    inline = [
      "curl -fsSL https://pgp.mongodb.com/server-7.0.asc| sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/mongodb-server-7.0.gpg",
      "echo 'deb [ arch=amd64,arm64 signed-by=/etc/apt/trusted.gpg.d/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list",
      "sudo apt-get update",
      "sudo apt --fix-broken install",
      "sudo apt-get install -y mongodb-org"
    ]
  }

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = tls_private_key.service.private_key_pem
    host        = self.public_ip
  }
}

resource "tls_private_key" "service" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "service" {
  key_name   = "tf-${var.app_name}-ec2.pem"
  public_key = tls_private_key.service.public_key_openssh
}

resource "local_file" "service_private_key" {
  content  = tls_private_key.service.private_key_pem
  filename = aws_key_pair.service.key_name
  provisioner "local-exec" {
    command = "chmod 400 ${aws_key_pair.service.key_name}"
  }
}
